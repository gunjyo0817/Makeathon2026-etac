import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import type { Lead } from "@/data/mock";
import { LeadHeader } from "@/components/sales/LeadHeader";
import { ConversationHistory } from "@/components/sales/ConversationHistory";
import { LeadStatusPanel } from "@/components/sales/LeadStatusPanel";
import { AgentPlanPanel } from "@/components/sales/AgentPlanPanel";
import { ControlPanel } from "@/components/sales/ControlPanel";
import { UpcomingMeetings } from "@/components/sales/UpcomingMeetings";
import { getLeads, getProducts, getTranscriptsForCustomer, type LeadRow, type ProductRow } from "@/lib/api";
import { mapLeadRowToLead } from "@/lib/mapLeadRowToLead";
import { dominantChannelFromMessages, transcriptRowsToMessages } from "@/lib/parseTranscriptToMessages";

export default function CustomerDetail() {
  const { id } = useParams();
  const routeId = id?.trim() ?? "";
  const [lead, setLead] = useState<Lead | null>(null);
  const [productName, setProductName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!routeId) {
        setLead(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [leadRows, productRows, transcriptRows] = await Promise.all([
          getLeads(),
          getProducts(),
          getTranscriptsForCustomer(routeId),
        ]);
        const row = leadRows.find((l) => String(l.id) === routeId);
        if (!row) {
          setLead(null);
          setProductName(undefined);
          return;
        }
        const base = mapLeadRowToLead(row);
        const messages = transcriptRowsToMessages(transcriptRows, base.name);
        const currentChannel =
          messages.length > 0 ? dominantChannelFromMessages(messages) : base.currentChannel;
        setLead({ ...base, messages, currentChannel });
        const pid = row.product_id ?? row.productId;
        if (pid == null || pid === "") {
          setProductName("Unassigned");
        } else {
          const product = productRows.find((p: ProductRow) => String(p.id) === String(pid));
          setProductName(product?.name ?? `Product #${pid}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
        setLead(null);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [routeId]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-card text-sm text-muted-foreground">
            Loading lead...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-destructive/30 rounded-3xl p-10 text-center shadow-card">
            <h2 className="text-lg font-bold text-destructive">Failed to load lead</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-card">
            <h2 className="text-lg font-bold">Lead not found</h2>
            <p className="text-sm text-muted-foreground mt-2">The lead you're looking for doesn't exist.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-6 max-w-[1600px] mx-auto">
        <LeadHeader lead={lead} productName={productName} />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="flex flex-col gap-6 min-w-0">
            <ConversationHistory lead={lead} />
            <AgentPlanPanel actions={lead.actions} />
          </div>
          <div className="flex flex-col gap-6">
            <ControlPanel initialPaused={lead.agentPaused} />
            <LeadStatusPanel lead={lead} />
            <UpcomingMeetings meetings={lead.meetings} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
