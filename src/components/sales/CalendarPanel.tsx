import { useNavigate } from "react-router-dom";
import type { Meeting } from "@/data/mock";
import { formatTime } from "@/lib/format";
import { MeetingTypeBadge } from "./Badges";
import { ArrowUpRight, Calendar, Video } from "lucide-react";

export function CalendarPanel({
  meetings,
  browseHref,
}: {
  meetings: Meeting[];
  browseHref?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
            <Calendar className="size-4" />
          </div>
          <div>
            <div className="text-sm font-bold leading-none">Today's Calendar</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{meetings.length} meetings</span>
          {browseHref && (
            <button
              type="button"
              onClick={() => navigate(browseHref)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Open calendar
              <ArrowUpRight className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {meetings.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No meetings scheduled today.</div>
        )}
        {meetings.map((m, i) => (
          <button
            key={m.id}
            onClick={() => navigate(`/leads/${m.leadId}`)}
            className="text-left px-5 py-4 flex gap-4 hover:bg-muted/60 transition-colors group relative"
          >
            {i === 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />}
            <div className="w-14 shrink-0">
              <div className="text-sm font-bold tabular-nums leading-none">{formatTime(m.start)}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{m.durationMin}min</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MeetingTypeBadge type={m.type} />
              </div>
              <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{m.customerName}</div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                <Video className="size-3" />
                {m.company}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
