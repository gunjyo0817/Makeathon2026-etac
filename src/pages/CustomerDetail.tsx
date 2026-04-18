import { useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { getLeadById } from "@/data/mock";
import { LeadHeader } from "@/components/sales/LeadHeader";
import { ConversationHistory } from "@/components/sales/ConversationHistory";
import { LeadStatusPanel } from "@/components/sales/LeadStatusPanel";
import { AgentPlanPanel } from "@/components/sales/AgentPlanPanel";
import { ControlPanel } from "@/components/sales/ControlPanel";
import { UpcomingMeetings } from "@/components/sales/UpcomingMeetings";

export default function CustomerDetail() {
  const { id } = useParams();
  const lead = id ? getLeadById(id) : undefined;

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
        <LeadHeader lead={lead} />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
          <div className="flex flex-col gap-6 min-w-0">
            <ConversationHistory messages={lead.messages} customerName={lead.name} />
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
