import { getAgentByProductId, leads } from "@/data/mock";
import { TrendingUp, Users, CheckCircle2, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const toneClass = {
  success: "bg-success-soft text-success",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-soft text-warning",
};

export function MetricsRow({ productId }: { productId: string }) {
  const navigate = useNavigate();
  const productLeads = leads.filter((lead) => lead.productId === productId);
  const activeLeads = productLeads.filter((lead) => lead.status !== "closed");
  const qualifiedLeads = productLeads.filter((lead) => lead.status === "qualified" || lead.status === "meeting");
  const meetings = productLeads
    .flatMap((lead) => lead.meetings.map((meeting) => ({ ...meeting, leadName: lead.name })))
    .sort((a, b) => a.start.localeCompare(b.start));
  const responseRate = productLeads.length
    ? Math.round((productLeads.filter((lead) => lead.status === "responded" || lead.status === "qualified" || lead.status === "meeting").length / productLeads.length) * 100)
    : 0;
  const agent = getAgentByProductId(productId);
  const channelBaseRate: Record<string, number> = { Email: 61, SMS: 54, Phone: 72, Chat: 67, WhatsApp: 64 };
  const channelRates = (agent?.channels ?? ["Email", "Phone"]).map((channel) => ({
    channel,
    rate: channelBaseRate[channel] ?? 58,
  }));

  const items = [
    {
      label: "Active Leads",
      value: activeLeads.length,
      delta: `${Math.min(activeLeads.length, 6)} touched today`,
      deltaTone: "success" as const,
      icon: Users,
      detailTitle: "Active Leads",
      content: (
        <ul className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
          {activeLeads.slice(0, 8).map((lead) => (
            <li key={lead.id}>
              <button
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="w-full text-left text-xs text-muted-foreground px-3 py-2.5 hover:bg-muted transition-colors"
              >
                {lead.name} - {lead.company}
              </button>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: "Qualified Leads",
      value: qualifiedLeads.length,
      delta: `${qualifiedLeads.length} in consideration`,
      deltaTone: "success" as const,
      icon: CheckCircle2,
      detailTitle: "Qualified Leads",
      content: (
        <ul className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
          {qualifiedLeads.slice(0, 8).map((lead) => (
            <li key={lead.id}>
              <button
                onClick={() => navigate(`/leads/${lead.id}`)}
                className="w-full text-left text-xs text-muted-foreground px-3 py-2.5 hover:bg-muted transition-colors"
              >
                {lead.name} - interest {lead.intentScore}
              </button>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: "Scheduled Meetings",
      value: meetings.length,
      delta: meetings[0] ? `Next: ${formatMeetingTime(meetings[0].start)}` : "No upcoming meetings",
      deltaTone: "neutral" as const,
      icon: Calendar,
      detailTitle: "Scheduled Meetings",
      content: (
        <ul className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
          {meetings.slice(0, 8).map((meeting) => (
            <li key={meeting.id}>
              <button
                onClick={() => navigate(`/leads/${meeting.leadId}`)}
                className="w-full text-left text-xs text-muted-foreground px-3 py-2.5 hover:bg-muted transition-colors"
              >
                {meeting.customerName} - {formatMeetingTime(meeting.start)}
              </button>
            </li>
          ))}
        </ul>
      ),
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      delta: `${channelRates.length} active channels`,
      deltaTone: "success" as const,
      icon: TrendingUp,
      detailTitle: "Response Rate by Channel",
      content: (
        <ul className="mt-2 divide-y divide-border border border-border rounded-xl overflow-hidden">
          {channelRates.map((entry) => (
            <li key={entry.channel} className="text-xs text-muted-foreground px-3 py-2.5 flex items-center justify-between">
              <span>{entry.channel}</span>
              <span className="font-semibold text-foreground">{entry.rate}%</span>
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((m) => (
        <div key={m.label} className="bg-card p-5 rounded-3xl border border-border shadow-card flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-muted-foreground">{m.label}</span>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="size-7 rounded-lg border border-border text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors"
                    aria-label={`Show ${m.label} details`}
                  >
                    <ArrowUpRight className="size-3.5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>{m.detailTitle}</DialogTitle>
                  </DialogHeader>
                  {m.content}
                </DialogContent>
              </Dialog>
              <div className="size-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <m.icon className="size-4" />
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{m.value}</div>
          <div className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", toneClass[m.deltaTone])}>
            {m.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function formatMeetingTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
