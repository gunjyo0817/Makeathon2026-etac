import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { leads } from "@/data/mock";
import { MeetingTypeBadge } from "@/components/sales/Badges";
import { formatTime } from "@/lib/format";
import { Calendar, Video, ChevronRight } from "lucide-react";

export default function Meetings() {
  const navigate = useNavigate();

  const meetings = useMemo(
    () => leads.flatMap((l) => l.meetings.map((m) => ({ ...m, lead: l }))).sort((a, b) => a.start.localeCompare(b.start)),
    []
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof meetings>();
    meetings.forEach((m) => {
      const key = new Date(m.start).toDateString();
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [meetings]);

  const todayKey = new Date().toDateString();

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1200px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {meetings.length} upcoming meetings booked by Aura across your pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-soft">
            <Calendar className="size-4 text-primary" />
            <span className="text-sm font-semibold">This week</span>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {grouped.map(([date, items]) => {
            const isToday = date === todayKey;
            return (
              <section key={date}>
                <div className="flex items-baseline gap-3 mb-3 px-1">
                  <h2 className="text-sm font-bold uppercase tracking-widest">
                    {isToday ? "Today" : new Date(date).toLocaleDateString([], { weekday: "long" })}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString([], { month: "long", day: "numeric" })}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">{items.length} meetings</span>
                </div>

                <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden divide-y divide-border">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/leads/${m.leadId}`)}
                      className="w-full text-left px-5 py-4 flex items-center gap-5 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="w-20 shrink-0">
                        <div className="text-base font-bold tabular-nums leading-none">{formatTime(m.start)}</div>
                        <div className="text-[11px] text-muted-foreground mt-1.5">{m.durationMin}min</div>
                      </div>

                      <div className="size-10 rounded-full bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                        {m.customerName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MeetingTypeBadge type={m.type} />
                        </div>
                        <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                          {m.customerName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                          <Video className="size-3" /> {m.company}
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </section>
            );
          })}

          {meetings.length === 0 && (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground">
              No upcoming meetings.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
