import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { leads, projects } from "@/data/mock";
import { MeetingTypeBadge } from "@/components/sales/Badges";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { ProjectSelector } from "@/components/sales/ProjectSelector";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ViewMode = "day" | "3days" | "week" | "month";
type LayoutMode = "calendar" | "list";

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
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("calendar");
  const [isSpotsDialogOpen, setIsSpotsDialogOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [spotsDraft, setSpotsDraft] = useState<Record<string, string[]>>({});
  const [dragState, setDragState] = useState<{ dateKey: string; mode: "add" | "remove" } | null>(null);
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
  const hasSpotsDraftChanges = JSON.stringify(spotsDraft) !== JSON.stringify(availability);

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

  const groupedMeetings = useMemo(() => {
    const map = new Map<string, typeof scopedMeetings>();
    scopedMeetings.forEach((meeting) => {
      const key = new Date(meeting.start).toDateString();
      const current = map.get(key) ?? [];
      current.push(meeting);
      map.set(key, current);
    });
    return Array.from(map.entries());
  }, [scopedMeetings]);

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

  const paintSpot = (date: Date, slot: string, mode: "add" | "remove") => {
    const key = dateKey(date);
    setSpotsDraft((prev) => {
      const current = new Set(prev[key] ?? []);
      if (mode === "add") current.add(slot);
      else current.delete(slot);
      return {
        ...prev,
        [key]: Array.from(current).sort(),
      };
    });
  };

  useEffect(() => {
    const endDrag = () => setDragState(null);
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);

  const openSpotsDialog = () => {
    setSpotsDraft(JSON.parse(JSON.stringify(availability)));
    setIsSpotsDialogOpen(true);
  };

  const requestCloseSpotsDialog = () => {
    if (hasSpotsDraftChanges) {
      setIsDiscardConfirmOpen(true);
      return;
    }
    setIsSpotsDialogOpen(false);
    setDragState(null);
  };

  const discardSpotsDialog = () => {
    setIsDiscardConfirmOpen(false);
    setIsSpotsDialogOpen(false);
    setDragState(null);
  };

  const saveSpotsDialog = () => {
    setAvailabilityByProject((prev) => ({
      ...prev,
      [projectId]: spotsDraft,
    }));
    setIsSpotsDialogOpen(false);
    setDragState(null);
  };

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1700px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground mt-2 text-sm">Calendar-first scheduling. Agents use your available spots to open booking windows to leads.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ProjectSelector selectedId={projectId} onSelect={setProjectId} />
            <div className="flex items-center rounded-2xl border border-border bg-card p-1">
              <button
                onClick={() => setLayoutMode("calendar")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl",
                  layoutMode === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                Calendar
              </button>
              <button
                onClick={() => setLayoutMode("list")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl",
                  layoutMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                List
              </button>
            </div>
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
            <Dialog open={isSpotsDialogOpen} onOpenChange={(open) => (open ? openSpotsDialog() : requestCloseSpotsDialog())}>
              <DialogTrigger asChild>
                <button onClick={openSpotsDialog} className="h-10 px-4 rounded-2xl border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors">
                  Available spots
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Available spots</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground -mt-2">Drag across time cells to paint availability. Click and drag on green slots to remove.</p>
                {viewMode === "month" ? (
                  <MonthGrid
                    dates={visibleDates}
                    meetingByDate={meetingByDate}
                    availability={spotsDraft}
                    onDayClick={(date) => setAnchorDate(date)}
                  />
                ) : (
                  <TimeGrid
                    dates={visibleDates}
                    timeSlots={timeSlots}
                    meetingByDate={meetingByDate}
                    availability={spotsDraft}
                    onToggleSpot={toggleSpot}
                    onCellMouseDown={(date, slot, isAvailable) => {
                      const mode: "add" | "remove" = isAvailable ? "remove" : "add";
                      paintSpot(date, slot, mode);
                      setDragState({ dateKey: dateKey(date), mode });
                    }}
                    onCellMouseEnter={(date, slot) => {
                      if (!dragState) return;
                      if (dragState.dateKey !== dateKey(date)) return;
                      paintSpot(date, slot, dragState.mode);
                    }}
                    onCellMouseUp={() => setDragState(null)}
                    onMeetingClick={(leadId) => navigate(`/leads/${leadId}`)}
                    editable
                  />
                )}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={requestCloseSpotsDialog}
                    className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    X
                  </button>
                  <button
                    onClick={saveSpotsDialog}
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                </div>
              </DialogContent>
            </Dialog>
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

        {layoutMode === "calendar" ? (
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
                editable={false}
              />
            )}
          </section>
        ) : (
          <section className="bg-card border border-border rounded-3xl p-4 shadow-card">
            <div className="text-sm font-semibold mb-3">List view</div>
            <div className="space-y-4">
              {groupedMeetings.map(([date, items]) => (
                <div key={date}>
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    {new Date(date).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                  <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
                    {items.map((meeting) => (
                      <button
                        key={meeting.id}
                        onClick={() => navigate(`/leads/${meeting.leadId}`)}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{meeting.customerName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {new Date(meeting.start).toLocaleString([], { hour: "numeric", minute: "2-digit" })} - {meeting.company}
                            </div>
                          </div>
                          <MeetingTypeBadge type={meeting.type} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {groupedMeetings.length === 0 && <div className="text-sm text-muted-foreground">No meetings in this range.</div>}
            </div>
          </section>
        )}

        <AlertDialog open={isDiscardConfirmOpen} onOpenChange={setIsDiscardConfirmOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved available spot edits. If you close now, those changes will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Keep editing</AlertDialogCancel>
              <AlertDialogAction onClick={discardSpotsDialog} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
  onMeetingClick,
  editable,
}: {
  dates: Date[];
  timeSlots: string[];
  meetingByDate: Map<string, any[]>;
  availability: Record<string, string[]>;
  onToggleSpot: (date: Date, slot: string) => void;
  onCellMouseDown?: (date: Date, slot: string, isAvailable: boolean) => void;
  onCellMouseEnter?: (date: Date, slot: string) => void;
  onCellMouseUp?: () => void;
  onMeetingClick: (leadId: string) => void;
  editable: boolean;
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
    <div className="overflow-auto max-h-[65vh]">
      <div
        className="grid min-w-[680px] md:min-w-[900px]"
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
            <div key={`label_${slot}`} className="border-r border-b border-border px-2 py-1.5 text-[10px] text-muted-foreground tabular-nums bg-background">
              {slot}
            </div>
            {dates.map((date) => {
              const dKey = dateKey(date);
              const isAvailable = (availability[dKey] ?? []).includes(slot);
              const meetings = meetingsByDateSlot.get(`${dKey}_${slot}`) ?? [];
              return (
                <div
                  key={`${dKey}_${slot}`}
                  onMouseDown={(e) => {
                    if (!editable) return;
                    e.preventDefault();
                    onCellMouseDown?.(date, slot, isAvailable);
                  }}
                  onMouseEnter={() => {
                    if (!editable) return;
                    onCellMouseEnter?.(date, slot);
                  }}
                  onMouseUp={() => {
                    if (!editable) return;
                    onCellMouseUp?.();
                  }}
                  className={cn(
                    "relative border-r border-b border-border min-h-[24px] px-1 text-left transition-colors",
                    isAvailable ? "bg-success-soft/70 hover:bg-success-soft border-success/30" : "hover:bg-muted/50",
                    editable && "cursor-pointer"
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
                </div>
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
            className={cn("h-24 md:h-28 border-r border-b border-border p-2 text-left hover:bg-muted/50", !inCurrentMonth && "opacity-45")}
          >
            <div className="text-sm font-semibold tabular-nums">{date.getDate()}</div>
            <div className="mt-2 space-y-1">
              <div className="text-[11px] text-muted-foreground">{meetings.length} meetings</div>
              <div className="text-[11px] text-success">{spotCount} available spots</div>
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
