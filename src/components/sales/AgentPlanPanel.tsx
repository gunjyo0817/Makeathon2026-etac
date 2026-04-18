import { useEffect, useRef } from "react";
import { type AgentAction } from "@/data/mock";
import { PriorityBadge } from "./Badges";
import { Sparkles, Pencil, Clock, Phone, AlarmClock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";

export function AgentPlanPanel({
  actions,
  onFollowUpAlarmClick,
  isFollowUpAlarmLoading = false,
}: {
  actions: AgentAction[];
  onFollowUpAlarmClick?: (action: AgentAction) => void;
  isFollowUpAlarmLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [actions]);

  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-gradient-clay text-primary-foreground flex items-center justify-center">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold leading-none">Agent Plan</div>
          <div className="text-[11px] text-muted-foreground mt-1">Next actions Etac will take autonomously</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex max-h-[34rem] flex-col overflow-y-auto">
        {actions.length === 0 && (
          <div className="px-5 py-8 text-sm text-muted-foreground text-center">No upcoming actions.</div>
        )}
        {actions.map((a, i) => {
          const next = actions[i + 1];
          const showDivider =
            a.kind === "history" && next?.kind !== "history";

          return (
            <div
              key={a.id}
              className={`px-5 ${
                a.kind === "history"
                  ? showDivider
                    ? "pt-1 pb-4"
                    : "py-1"
                  : "py-4"
              } ${showDivider ? "border-b border-border" : ""}`}
            >
              <div
                className={`flex gap-4 ${
                  a.kind === "history"
                    ? "rounded-2xl border border-border bg-muted/40 px-4 py-3"
                    : a.icon === "phone"
                      ? "rounded-2xl border border-info/20 bg-info-soft/45 px-4 py-3"
                      : ""
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`size-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                      a.kind === "history"
                        ? "bg-white/85 text-info shadow-sm"
                        : a.icon === "phone"
                          ? "bg-white/85 text-info shadow-sm"
                          : "bg-primary-soft text-primary"
                    }`}
                  >
                    {a.icon === "phone" ? <Phone className="size-3.5" /> : i + 1}
                  </div>
                  {a.kind !== "history" && i < actions.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                </div>

                <div className="flex-1 min-w-0 pb-1">
                  {a.kind === "history" ? (
                    <div className="flex min-h-12 flex-col justify-between gap-2">
                      <div className="text-sm font-semibold leading-snug text-info/70">{a.title}</div>
                      {a.reason ? <p className="text-xs text-info/60 leading-relaxed text-pretty">{a.reason}</p> : null}
                    </div>
                  ) : (
                    <>
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div className="font-semibold text-sm leading-snug">{a.title}</div>
                        {a.kind === "follow_up" ? (
                          <button
                            type="button"
                            onClick={() => onFollowUpAlarmClick?.(a)}
                            disabled={isFollowUpAlarmLoading}
                            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/85 text-info shadow-sm transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-info/30 disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Trigger follow-up phone call"
                          >
                            <AlarmClock className="size-3.5" />
                          </button>
                        ) : (
                          <PriorityBadge priority={a.priority} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{a.reason}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {formatDate(a.scheduledFor)} · {formatTime(a.scheduledFor)}
                        </div>
                        <button className="text-[11px] font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors">
                          <Pencil className="size-3" />
                          Edit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
