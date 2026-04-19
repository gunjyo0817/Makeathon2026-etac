import { TrendingUp, Users, CheckCircle2, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const toneClass = {
  success: "bg-success-soft text-success",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-warning-soft text-warning",
};

type MetricLead = {
  id: string;
  name: string;
  company: string;
  status: string;
};

type MetricMeeting = {
  id: string;
  leadId: string;
  customerName: string;
  start: string;
};

export function MetricsRow({
  productId,
  leads,
  meetings,
}: {
  productId: string;
  leads: MetricLead[];
  meetings: MetricMeeting[];
}) {
  const navigate = useNavigate();
  const isAllProducts = productId === "all";
  const activeLeads = leads.filter((lead) => lead.status !== "closed");
  const qualifiedLeads = leads.filter((lead) => lead.status === "qualified" || lead.status === "meeting");
  const sortedMeetings = [...meetings].sort((a, b) => a.start.localeCompare(b.start));
  const responseRate = leads.length
    ? Math.round(
        (leads.filter((lead) => lead.status === "responded" || lead.status === "qualified" || lead.status === "meeting").length /
          leads.length) *
          100
      )
    : 0;
  const productQuery = encodeURIComponent(productId);

  const items = [
    {
      label: "Active Leads",
      value: activeLeads.length,
      delta: `${Math.min(activeLeads.length, 6)} touched today`,
      deltaTone: "success" as const,
      icon: Users,
      href: isAllProducts ? "/leads" : `/leads?productId=${productQuery}`,
    },
    {
      label: "Qualified Leads",
      value: qualifiedLeads.length,
      delta: `${qualifiedLeads.length} in consideration`,
      deltaTone: "success" as const,
      icon: CheckCircle2,
      href: isAllProducts ? "/leads?status=qualified" : `/leads?productId=${productQuery}&status=qualified`,
    },
    {
      label: "Scheduled trials",
      value: sortedMeetings.length,
      delta: sortedMeetings[0] ? `Next: ${formatMeetingTime(sortedMeetings[0].start)}` : "No upcoming trials",
      deltaTone: "neutral" as const,
      icon: Calendar,
      href: isAllProducts ? "/meetings" : `/meetings?productId=${productQuery}`,
    },
    {
      label: "Response Rate",
      value: `${responseRate}%`,
      delta: `${leads.length} tracked leads`,
      deltaTone: "success" as const,
      icon: TrendingUp,
      href: "/analytics",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {items.map((m) => (
        <button
          key={m.label}
          type="button"
          onClick={() => navigate(m.href)}
          className="bg-card p-5 rounded-3xl border border-border shadow-card flex flex-col gap-3 text-left hover:border-primary/40 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-start justify-between">
            <span className="text-sm font-medium text-muted-foreground">{m.label}</span>
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg border border-border text-muted-foreground flex items-center justify-center bg-background/80">
                <ArrowUpRight className="size-3.5" />
              </div>
              <div className="size-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <m.icon className="size-4" />
              </div>
            </div>
          </div>
          <div className="text-3xl font-bold tracking-tight tabular-nums">{m.value}</div>
          <div className={cn("inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", toneClass[m.deltaTone])}>
            {m.delta}
          </div>
        </button>
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
