import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricsRow } from "@/components/sales/MetricsRow";
import { ProductSelector } from "@/components/sales/ProductSelector";
import { CalendarPanel } from "@/components/sales/CalendarPanel";
import { PipelineBoard } from "@/components/sales/PipelineBoard";
import { ConversationAttentionPanel } from "@/components/sales/ConversationAttentionPanel";
import { conversationsNeedingAttention, type Lead, type LeadStatus, type Meeting, type Temperature } from "@/data/mock";
import { getLeads, getProducts, getTwinTableRows, type LeadRow, type ProductRow } from "@/lib/api";
import { mapTwinMeetingsToRecords } from "@/lib/meetingCalendarSync";
import { intentFromLeadStatus, normalizeLeadStatus, temperatureFromLeadStatus } from "@/lib/mapLeadRowToLead";


const UNASSIGNED_PRODUCT_ID = "unassigned";
const ALL_PRODUCTS_ID = "all";

type SelectorProduct = {
  id: string;
  name: string;
  description?: string;
  leadCount?: number;
};

export default function Dashboard() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [meetingRows, setMeetingRows] = useState<Record<string, unknown>[]>([]);
  const [conversationRows, setConversationRows] = useState<Record<string, unknown>[]>([]);
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productRows, leadRows, rawMeetings, rawConversations] = await Promise.all([
          getProducts(),
          getLeads(),
          getTwinTableRows("etac_meetings"),
          getTwinTableRows("etac_conversation"),
        ]);
        setProducts(productRows);
        setLeads(leadRows);
        setMeetingRows(rawMeetings);
        setConversationRows(rawConversations);
        setProductId((current) => current || ALL_PRODUCTS_ID);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const inferredProductByLeadId = useMemo(() => {
    const inferred = new Map<string, string>();

    for (const lead of leads) {
      const directProductId = lead.product_id ?? lead.productId;
      if (directProductId != null && directProductId !== "") {
        inferred.set(String(lead.id), String(directProductId));
      }
    }

    const latestConversationByLeadId = new Map<string, Record<string, unknown>>();
    for (const row of conversationRows) {
      const leadId = String(row.lead_id ?? row.leadId ?? "").trim();
      if (!leadId) continue;
      const current = latestConversationByLeadId.get(leadId);
      const nextTs = conversationSortValue(row);
      const currentTs = current ? conversationSortValue(current) : -Infinity;
      if (!current || nextTs >= currentTs) latestConversationByLeadId.set(leadId, row);
    }

    for (const [leadId, row] of latestConversationByLeadId) {
      const assignedProductId = row.assigned_product_id ?? row.assignedProductId;
      if (assignedProductId != null && assignedProductId !== "" && !inferred.has(leadId)) {
        inferred.set(leadId, String(assignedProductId));
      }
    }

    return inferred;
  }, [conversationRows, leads]);

  const selectorProducts = useMemo<SelectorProduct[]>(
    () =>
      products.map((product) => ({
        id: String(product.id),
        name: product.name,
        description: product.description,
        leadCount: leads.filter((lead) => (inferredProductByLeadId.get(String(lead.id)) ?? UNASSIGNED_PRODUCT_ID) === String(product.id)).length,
      })),
    [inferredProductByLeadId, leads, products]
  );

  const dashboardMeetings = useMemo<(Meeting & { productId: string })[]>(
    () =>
      mapTwinMeetingsToRecords(
        meetingRows,
        leads.map((lead) => ({ id: lead.id, full_name: lead.full_name, company: lead.company })),
        UNASSIGNED_PRODUCT_ID
      ).map((meeting) => ({
        id: meeting.id,
        leadId: meeting.leadId,
        customerName: meeting.customerName,
        company: meeting.company,
        type: meeting.type,
        start: meeting.start,
        durationMin: meeting.durationMin,
        productId: inferredProductByLeadId.get(meeting.leadId) ?? UNASSIGNED_PRODUCT_ID,
      })),
    [inferredProductByLeadId, leadRowsSignature(leads), leads, meetingRows]
  );

  const dashboardLeads = useMemo<Lead[]>(
    () =>
      leads.map((lead) => {
        const status = normalizeLeadStatus(lead.status);
        const pid = inferredProductByLeadId.get(String(lead.id)) ?? String(lead.product_id ?? lead.productId ?? UNASSIGNED_PRODUCT_ID);
        return {
          id: String(lead.id),
          productId: pid,
          name: lead.full_name ?? "Unknown Lead",
          role: "Prospect",
          company: lead.company ?? "-",
          email: lead.email ?? "",
          status,
          temperature: temperatureFromLeadStatus(status),
          lastInteractionAt: lead.updated_at ?? lead.created_at ?? new Date().toISOString(),
          intentScore: intentFromLeadStatus(status),
          budget: "-",
          urgency: "Medium",
          interestLevel: status === "meeting" || status === "qualified" ? "High" : "Medium",
          agentPaused: false,
          currentChannel: "phone",
          availableChannels: ["phone"],
          messages: [],
          actions: [],
          meetings: dashboardMeetings.filter((meeting) => meeting.leadId === String(lead.id)),
        };
      }),
    [dashboardMeetings, inferredProductByLeadId, leads]
  );

  const filteredLeads = useMemo(
    () => (productId === ALL_PRODUCTS_ID ? dashboardLeads : dashboardLeads.filter((lead) => lead.productId === productId)),
    [dashboardLeads, productId]
  );

  const filteredMeetings = useMemo(
    () => (productId === ALL_PRODUCTS_ID ? dashboardMeetings : dashboardMeetings.filter((meeting) => meeting.productId === productId)),
    [dashboardMeetings, productId]
  );

  const todaysMeetings = useMemo(
    () =>
      filteredMeetings
        .filter((meeting) => isSameLocalDay(new Date(meeting.start), new Date()))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [filteredMeetings]
  );

  const attentionItems = conversationsNeedingAttention;

  const dashboardLeadHref = productId === ALL_PRODUCTS_ID ? "/leads" : `/leads?productId=${encodeURIComponent(productId)}`;
  const dashboardMeetingHref = productId === ALL_PRODUCTS_ID ? "/meetings" : `/meetings?productId=${encodeURIComponent(productId)}`;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-2 sm:gap-7 sm:px-6 sm:pb-10 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Good morning, Elias.</h1>
            <p className="text-muted-foreground mt-2 text-sm text-pretty">
              Etac is actively tracking <span className="text-foreground font-semibold">{filteredLeads.length} lead conversations</span> for you.
              {todaysMeetings[0] && (
                <span className="text-primary font-medium"> {todaysMeetings[0].customerName}</span>
              )}{" "}
              {todaysMeetings[0]
                ? `call is booked for ${new Date(todaysMeetings[0].start).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })} today.`
                : "No meetings are booked for today yet."}
            </p>
          </div>
          <div className="w-full sm:w-auto sm:shrink-0 sm:self-end">
            <ProductSelector
              selectedId={productId}
              onSelect={setProductId}
              products={selectorProducts}
              includeAll
            />
          </div>
        </header>

        {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        {isLoading && <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">Loading dashboard...</div>}

        <MetricsRow productId={productId} leads={filteredLeads} meetings={filteredMeetings} />

        <ConversationAttentionPanel items={attentionItems} browseHref={dashboardLeadHref} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <PipelineBoard leads={filteredLeads} browseHref={dashboardLeadHref} />
          <CalendarPanel meetings={todaysMeetings} browseHref={dashboardMeetingHref} />
        </div>
      </div>
    </AppShell>
  );
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function conversationSortValue(row: Record<string, unknown>): number {
  const followUp = Date.parse(String(row.follow_up_date ?? row.followUpDate ?? ""));
  if (Number.isFinite(followUp)) return followUp;

  const createdAt = Date.parse(String(row.created_at ?? row.createdAt ?? ""));
  if (Number.isFinite(createdAt)) return createdAt;

  return -Infinity;
}

function leadRowsSignature(rows: LeadRow[]): string {
  return rows.map((row) => `${row.id}:${row.updated_at ?? row.created_at ?? ""}`).join("|");
}
