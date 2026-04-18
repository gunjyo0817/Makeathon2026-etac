import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { leads, projects } from "@/data/mock";
import { MeetingTypeBadge } from "@/components/sales/Badges";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { ProjectSelector } from "@/components/sales/ProjectSelector";
import { cn } from "@/lib/utils";

type ViewMode = "day" | "3days" | "week" | "month";

const viewModes: { id: ViewMode; label: string }[] = [
  { id: "day", label: "1 Day" },
  { id: "3days", label: "3 Days" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const timeSlots = Array.from({ length: 21 }, (_, i) => slotFromIndex(i)); // 08:00 - 18:00 (30min)

export default function Meetings() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState(projects[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchorDate, setAnchorDate] = useState(stripTime(new Date()));
  const [availabilityByProject, setAvailabilityByProject] = useState<Record<string, Record<string, string[]>>>(() =>
    Object.fromEntries(projects.map((project) => [project.id, {}]))
  );

  const allMeetings = useMemo(
    () =>
      leads
        .filter((lead) => lead.projectId === projectId)
        .flatMap((lead) => lead.meetings.map((meeting) => ({ ...meeting, leadName: lead.name })))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [projectId]
  );

  const visibleDates = useMemo(() => {
    if (viewMode === "day") return [stripTime(anchorDate)];
    if (viewMode === "3days") return [0, 1, 2].map((offset) => addDays(anchorDate, offset));
    if (viewMode === "week") {
      const start = startOfWeek(anchorDate);
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const monthGridStart = startOfWeek(monthStart);
    return Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i));
  }, [anchorDate, viewMode]);

  const meetingByDate = useMemo(() => {
    const map = new Map<string, typeof allMeetings>();
    allMeetings.forEach((meeting) => {
      const key = dateKey(new Date(meeting.start));
      const current = map.get(key) ?? [];
      current.push(meeting);
      map.set(key, current);
    });
    return map;
  }, [allMeetings]);

  const availability = availabilityByProject[projectId] ?? {};

  const rangeLabel = useMemo(() => {
    if (viewMode === "month") {
      return anchorDate.toLocaleDateString([], { month: "long", year: "numeric" });
    }
    const start = visibleDates[0];
    const end = visibleDates[visibleDates.length - 1];
    const startText = start.toLocaleDateString([], { month: "short", day: "numeric" });
    const endText = end.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${startText} - ${endText}`;
  }, [anchorDate, viewMode, visibleDates]);

  const scopedMeetings = useMemo(
    () =>
      allMeetings.filter((meeting) => {
        const day = stripTime(new Date(meeting.start));
        const min = visibleDates[0];
        const max = addDays(visibleDates[visibleDates.length - 1], 1);
        return day >= min && day < max;
      }),
    [allMeetings, visibleDates]
  );

  const availableSpotSummary = useMemo(() => {
    return visibleDates
      .map((date) => {
        const key = dateKey(date);
        const slots = availability[key] ?? [];
        return { date, slots };
      })
      .filter((item) => item.slots.length > 0);
  }, [availability, visibleDates]);

  const stepRange = (dir: -1 | 1) => {
    if (viewMode === "day") return addDays(anchorDate, dir);
    if (viewMode === "3days") return addDays(anchorDate, 3 * dir);
    if (viewMode === "week") return addDays(anchorDate, 7 * dir);
    return addMonths(anchorDate, dir);
  };

  const toggleSpot = (date: Date, slot: string) => {
    const key = dateKey(date);
    setAvailabilityByProject((prev) => {
      const projectMap = prev[projectId] ?? {};
      const current = new Set(projectMap[key] ?? []);
      if (current.has(slot)) current.delete(slot);
      else current.add(slot);
      return {
        ...prev,
        [projectId]: {
          ...projectMap,
          [key]: Array.from(current).sort(),
        },
      };
    });
  };

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1700px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground mt-2 text-sm">Google Calendar style planning + click-to-highlight available spots for agent booking.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ProjectSelector selectedId={projectId} onSelect={setProjectId} />
            <div className="flex items-center rounded-2xl border border-border bg-card p-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-xl",
                    viewMode === mode.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-card border border-border rounded-2xl px-2 py-1.5 shadow-soft">
              <button onClick={() => setAnchorDate(stepRange(-1))} className="size-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <ChevronLeft className="size-4" />
              </button>
              <div className="px-2 inline-flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <span className="text-sm font-semibold">{rangeLabel}</span>
              </div>
              <button onClick={() => setAnchorDate(stepRange(1))} className="size-8 rounded-lg hover:bg-muted flex items-center justify-center">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
          <section className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
            {viewMode === "month" ? (
              <MonthGrid
                dates={visibleDates}
                meetingByDate={meetingByDate}
                availability={availability}
                onDayClick={(date) => {
                  setAnchorDate(date);
                  setViewMode("day");
                }}
              />
            ) : (
              <TimeGrid
                dates={visibleDates}
                timeSlots={timeSlots}
                meetingByDate={meetingByDate}
                availability={availability}
                onToggleSpot={toggleSpot}
                onMeetingClick={(leadId) => navigate(`/leads/${leadId}`)}
              />
            )}
          </section>

          <aside className="bg-card border border-border rounded-3xl shadow-card p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold tracking-tight">Available spots</h2>
              <p className="text-xs text-muted-foreground mt-1">Click any time cell to highlight available slots. Agents immediately use highlighted spots for lead booking.</p>
            </div>

            <div className="rounded-2xl border border-border p-3 bg-muted/40">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How to edit</div>
              <div className="text-xs text-muted-foreground mt-1.5">Click a slot once to add availability. Click again to remove it.</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your available spots</div>
              {availableSpotSummary.length === 0 ? (
                <div className="text-xs text-muted-foreground rounded-xl border border-border p-3">No highlighted slots in current range.</div>
              ) : (
                <div className="rounded-2xl border border-border divide-y divide-border max-h-[420px] overflow-auto">
                  {availableSpotSummary.map((item) => (
                    <div key={dateKey(item.date)} className="px-3 py-2.5">
                      <div className="text-xs font-semibold">{item.date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</div>
                      <div className="text-[11px] text-muted-foreground mt-1">{item.slots.join(", ")}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Meetings in range</div>
              <div className="space-y-2">
                {scopedMeetings.slice(0, 6).map((meeting) => (
                  <button
                    key={meeting.id}
                    onClick={() => navigate(`/leads/${meeting.leadId}`)}
                    className="w-full text-left rounded-xl border border-border px-3 py-2 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">{meeting.customerName}</span>
                      <MeetingTypeBadge type={meeting.type} />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Clock className="size-3" />
                      {new Date(meeting.start).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </button>
                ))}
                {scopedMeetings.length === 0 && <div className="text-xs text-muted-foreground rounded-xl border border-border p-3">No meetings in this range.</div>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function TimeGrid({
  dates,
  timeSlots,
  meetingByDate,
  availability,
  onToggleSpot,
  onMeetingClick,
}: {
  dates: Date[];
  timeSlots: string[];
  meetingByDate: Map<string, any[]>;
  availability: Record<string, string[]>;
  onToggleSpot: (date: Date, slot: string) => void;
  onMeetingClick: (leadId: string) => void;
}) {
  const meetingsByDateSlot = useMemo(() => {
    const map = new Map<string, any[]>();
    dates.forEach((date) => {
      const dKey = dateKey(date);
      const meetings = meetingByDate.get(dKey) ?? [];
      meetings.forEach((meeting) => {
        const slot = toHalfHourSlot(new Date(meeting.start));
        const key = `${dKey}_${slot}`;
        const current = map.get(key) ?? [];
        current.push(meeting);
        map.set(key, current);
      });
    });
    return map;
  }, [dates, meetingByDate]);

  return (
    <div className="overflow-auto">
      <div
        className="grid min-w-[900px]"
        style={{
          gridTemplateColumns: `70px repeat(${dates.length}, minmax(120px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-border px-2 py-3 bg-background" />
        {dates.map((date) => (
          <div key={dateKey(date)} className="border-b border-r border-border px-2 py-3 bg-background">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
              {date.toLocaleDateString([], { weekday: "short" })}
            </div>
            <div className="text-lg font-bold tabular-nums">{date.getDate()}</div>
          </div>
        ))}

        {timeSlots.map((slot) => (
          <>
            <div key={`label_${slot}`} className="border-r border-b border-border px-2 py-2 text-[11px] text-muted-foreground tabular-nums bg-background">
              {slot}
            </div>
            {dates.map((date) => {
              const dKey = dateKey(date);
              const isAvailable = (availability[dKey] ?? []).includes(slot);
              const meetings = meetingsByDateSlot.get(`${dKey}_${slot}`) ?? [];
              return (
                <button
                  key={`${dKey}_${slot}`}
                  onClick={() => onToggleSpot(date, slot)}
                  className={cn(
                    "relative border-r border-b border-border min-h-[34px] px-1 text-left transition-colors",
                    isAvailable ? "bg-primary/20 hover:bg-primary/30" : "hover:bg-muted/50"
                  )}
                >
                  {meetings.length > 0 && (
                    <div className="absolute inset-1 rounded-md bg-info-soft border border-info/30 px-1.5 py-0.5 overflow-hidden">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMeetingClick(meetings[0].leadId);
                        }}
                        className="text-[10px] font-semibold text-info truncate w-full text-left"
                      >
                        {meetings[0].customerName}
                      </button>
                    </div>
                  )}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

function MonthGrid({
  dates,
  meetingByDate,
  availability,
  onDayClick,
}: {
  dates: Date[];
  meetingByDate: Map<string, any[]>;
  availability: Record<string, string[]>;
  onDayClick: (date: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
        <div key={label} className="px-3 py-2 border-b border-r border-border text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </div>
      ))}
      {dates.map((date) => {
        const dKey = dateKey(date);
        const meetings = meetingByDate.get(dKey) ?? [];
        const spotCount = (availability[dKey] ?? []).length;
        const inCurrentMonth = date.getMonth() === dates[15].getMonth();
        return (
          <button
            key={dKey}
            onClick={() => onDayClick(date)}
            className={cn("h-32 border-r border-b border-border p-2 text-left hover:bg-muted/50", !inCurrentMonth && "opacity-45")}
          >
            <div className="text-sm font-semibold tabular-nums">{date.getDate()}</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] text-muted-foreground">{meetings.length} meetings</div>
              <div className="text-[11px] text-primary">{spotCount} available spots</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function slotFromIndex(index: number) {
  const totalMinutes = 8 * 60 + index * 30;
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function toHalfHourSlot(date: Date) {
  const h = date.getHours().toString().padStart(2, "0");
  const roundedMin = date.getMinutes() < 30 ? "00" : "30";
  return `${h}:${roundedMin}`;
}

function startOfWeek(date: Date) {
  const d = stripTime(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function stripTime(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function dateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
