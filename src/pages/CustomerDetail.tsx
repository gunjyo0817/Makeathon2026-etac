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
import {
  getLatestConversationAssignmentForLead,
  getLeads,
  getProducts,
  getTranscriptsForCustomer,
  type LatestConversationAssignment,
  type LeadRow,
  type ProductRow,
} from "@/lib/api";
import { mapLeadRowToLead } from "@/lib/mapLeadRowToLead";
import { dominantChannelFromMessages, transcriptRowsToMessages } from "@/lib/parseTranscriptToMessages";

export default function CustomerDetail() {
  const { id } = useParams();
  const routeId = id?.trim() ?? "";
  const [lead, setLead] = useState<Lead | null>(null);
  const [latestAssignment, setLatestAssignment] = useState<LatestConversationAssignment | null>(null);
  const [productName, setProductName] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!routeId) {
        setLead(null);
        setLatestAssignment(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [leadRows, productRows, transcriptRows, assignment] = await Promise.all([
          getLeads(),
          getProducts(),
          getTranscriptsForCustomer(routeId),
          getLatestConversationAssignmentForLead(routeId),
        ]);
        setLatestAssignment(assignment);
        const row = leadRows.find((l) => String(l.id) === routeId);
        if (!row) {
          setLead(null);
          setLatestAssignment(null);
          setProductName(undefined);
          return;
        }
        const base = mapLeadRowToLead(row);
        const messages = transcriptRowsToMessages(transcriptRows, base.name);
        const currentChannel =
          messages.length > 0 ? dominantChannelFromMessages(messages) : base.currentChannel;
        const followUpAction =
          assignment.found && assignment.followUpDate
            ? {
                id: `follow-up-${routeId}`,
                title: `Follow up date: ${new Date(assignment.followUpDate).toLocaleString([], {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}`,
                reason: "Call the lead to continue the scheduled follow-up conversation.",
                scheduledFor: assignment.followUpDate,
                priority: "medium" as const,
                icon: "phone" as const,
              }
            : null;
        setLead({
          ...base,
          messages,
          currentChannel,
          actions: followUpAction ? [...base.actions, followUpAction] : base.actions,
        });
        const pid = row.product_id ?? row.productId;
        const assignedPid = assignment.assignedProductId;
        const resolvedPid = pid == null || pid === "" ? assignedPid : pid;
        if (resolvedPid == null || resolvedPid === "") {
          setProductName("Unassigned");
        } else {
          const product = productRows.find((p: ProductRow) => String(p.id) === String(resolvedPid));
          setProductName(product?.name ?? `Product #${resolvedPid}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
        setLead(null);
        setLatestAssignment(null);
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
