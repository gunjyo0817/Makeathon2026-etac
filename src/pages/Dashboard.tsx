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


const UNASSIGNED_PRODUCT_ID = "unassigned";

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
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productRows, leadRows, rawMeetings] = await Promise.all([
          getProducts(),
          getLeads(),
          getTwinTableRows("etac_meetings"),
        ]);
        setProducts(productRows);
        setLeads(leadRows);
        setMeetingRows(rawMeetings);
        setProductId((current) => current || String(productRows[0]?.id ?? ""));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const selectorProducts = useMemo<SelectorProduct[]>(
    () =>
      products.map((product) => ({
        id: String(product.id),
        name: product.name,
        description: product.description,
        leadCount: leads.filter((lead) => String(lead.product_id ?? lead.productId ?? UNASSIGNED_PRODUCT_ID) === String(product.id)).length,
      })),
    [leads, products]
  );

  const dashboardMeetings = useMemo<Meeting[]>(
    () =>
      mapTwinMeetingsToRecords(
        meetingRows,
        leads.map((lead) => ({ id: lead.id, full_name: lead.full_name, company: lead.company })),
        productId || String(products[0]?.id ?? "")
      ).map((meeting) => ({
        id: meeting.id,
        leadId: meeting.leadId,
        customerName: meeting.customerName,
        company: meeting.company,
        type: meeting.type,
        start: meeting.start,
        durationMin: meeting.durationMin,
      })),
    [leadRowsSignature(leads), leads, meetingRows, productId, products]
  );

  const dashboardLeads = useMemo<Lead[]>(
    () =>
      leads.map((lead) => {
        const status = normalizeStatus(lead.status);
        const pid = String(lead.product_id ?? lead.productId ?? UNASSIGNED_PRODUCT_ID);
        return {
          id: String(lead.id),
          productId: pid,
          name: lead.full_name ?? "Unknown Lead",
          role: "Prospect",
          company: lead.company ?? "-",
          email: lead.email ?? "",
          status,
          temperature: normalizeTemperature(status),
          lastInteractionAt: lead.updated_at ?? lead.created_at ?? new Date().toISOString(),
          intentScore: intentScoreForStatus(status),
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
    [dashboardMeetings, leads]
  );

  const filteredLeads = useMemo(
    () => dashboardLeads.filter((lead) => lead.productId === productId),
    [dashboardLeads, productId]
  );

  const filteredMeetings = useMemo(
    () => dashboardMeetings.filter((meeting) => {
      const lead = dashboardLeads.find((item) => item.id === meeting.leadId);
      return lead?.productId === productId;
    }),
    [dashboardLeads, dashboardMeetings, productId]
  );

  const todaysMeetings = useMemo(
    () =>
      filteredMeetings
        .filter((meeting) => isSameLocalDay(new Date(meeting.start), new Date()))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [filteredMeetings]
  );

  const attentionItems = conversationsNeedingAttention;

  const dashboardLeadHref = `/leads?productId=${encodeURIComponent(productId)}`;
  const dashboardMeetingHref = `/meetings?productId=${encodeURIComponent(productId)}`;

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance">Good morning, Elias.</h1>
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
          <ProductSelector
            selectedId={productId}
            onSelect={setProductId}
            products={selectorProducts}
          />
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

function normalizeStatus(status?: string): LeadStatus {
  if (!status) return "new";
  if (["new", "contacted", "responded", "qualified", "meeting", "closed"].includes(status)) {
    return status as LeadStatus;
  }
  return "new";
}

function normalizeTemperature(status: LeadStatus): Temperature {
  if (status === "qualified" || status === "meeting") return "hot";
  if (status === "contacted" || status === "responded") return "warm";
  return "cold";
}

function intentScoreForStatus(status: LeadStatus): number {
  if (status === "meeting") return 92;
  if (status === "qualified") return 83;
  if (status === "responded") return 68;
  if (status === "contacted") return 54;
  return 36;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


function leadRowsSignature(rows: LeadRow[]): string {
  return rows.map((row) => `${row.id}:${row.updated_at ?? row.created_at ?? ""}`).join("|");
}
