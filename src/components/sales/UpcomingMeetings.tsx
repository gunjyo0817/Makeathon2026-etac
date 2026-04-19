import { type Meeting } from "@/data/mock";
import { MeetingTypeBadge } from "./Badges";
import { formatDate, formatTime } from "@/lib/format";
import { Calendar, MapPin } from "lucide-react";

export function UpcomingMeetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-success-soft text-success flex items-center justify-center">
          <Calendar className="size-4" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none">Upcoming trials</div>
          <div className="text-[11px] text-muted-foreground mt-1">{meetings.length} scheduled</div>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {meetings.map((m) => (
          <div key={m.id} className="px-5 py-4 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary-soft text-primary flex flex-col items-center justify-center shrink-0">
              <div className="text-[9px] uppercase tracking-wider font-semibold leading-none">{new Date(m.start).toLocaleDateString([], { month: "short" })}</div>
              <div className="text-base font-bold tabular-nums leading-none mt-0.5">{new Date(m.start).getDate()}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1"><MeetingTypeBadge type={m.type} /></div>
              <div className="text-xs font-semibold">{formatDate(m.start)} · {formatTime(m.start)} · {m.durationMin}min</div>
              <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-0.5"><MapPin className="size-3" /> In-person</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
