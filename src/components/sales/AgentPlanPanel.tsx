import { type AgentAction } from "@/data/mock";
import { PriorityBadge } from "./Badges";
import { Sparkles, Pencil, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";

export function AgentPlanPanel({ actions }: { actions: AgentAction[] }) {
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-gradient-clay text-primary-foreground flex items-center justify-center">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold leading-none">Agent Plan</div>
          <div className="text-[11px] text-muted-foreground mt-1">Next actions Aura will take autonomously</div>
        </div>
      </div>

      <div className="flex flex-col">
        {actions.length === 0 && (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">No upcoming actions.</div>
        )}
        {actions.map((a, i) => (
          <div key={a.id} className="px-5 py-4 flex gap-4 border-b border-border last:border-b-0">
            <div className="flex flex-col items-center">
              <div className="size-7 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold tabular-nums">
                {i + 1}
              </div>
              {i < actions.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="font-semibold text-sm leading-snug">{a.title}</div>
                <PriorityBadge priority={a.priority} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{a.reason}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                  <Clock className="size-3" />
                  {formatDate(a.scheduledFor)} · {formatTime(a.scheduledFor)}
                </div>
                <button className="text-[11px] font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors">
                  <Pencil className="size-3" />
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
