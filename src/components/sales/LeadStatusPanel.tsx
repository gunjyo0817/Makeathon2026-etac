import { type Lead } from "@/data/mock";
import { timeAgo } from "@/lib/format";
import { Activity, Target, DollarSign, AlarmClock, Flame, Clock } from "lucide-react";

export function LeadStatusPanel({ lead }: { lead: Lead }) {
  const rows = [
    { label: "Current Stage", value: stageLabel(lead.status), icon: Target },
    { label: "Interest Level", value: lead.interestLevel, icon: Flame },
    { label: "Budget", value: lead.budget, icon: DollarSign },
    { label: "Urgency", value: lead.urgency, icon: AlarmClock },
  ];
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-info-soft text-info flex items-center justify-center">
          <Activity className="size-4" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none">Lead Intelligence</div>
          <div className="text-[11px] text-muted-foreground mt-1">Structured data captured by Aura</div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="bg-muted/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Intent Score</div>
            <div className="text-2xl font-bold tabular-nums mt-1">{lead.intentScore}<span className="text-sm font-medium text-muted-foreground">/100</span></div>
          </div>
          <div className="w-24 h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-clay rounded-full transition-all"
              style={{ width: `${lead.intentScore}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="bg-muted/40 rounded-xl p-3 border border-border">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <r.icon className="size-3" />
                {r.label}
              </div>
              <div className="text-sm font-semibold mt-1.5 truncate">{r.value}</div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5 pt-1">
          <Clock className="size-3" />
          Last updated {timeAgo(lead.lastInteractionAt)}
        </div>
      </div>
    </div>
  );
}

function stageLabel(s: Lead["status"]) {
  return { new: "New Lead", contacted: "Contacted", responded: "Responded", qualified: "Qualified", meeting: "Meeting Scheduled", closed: "Closed" }[s];
}
