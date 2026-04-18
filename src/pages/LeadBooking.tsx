import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { confirmBooking, confirmBookingSlot, getBookingSession } from "@/lib/api";
import {
  SALES_HALF_HOUR_SLOTS,
  buildPickerCellLookup,
  dateKeyLocal,
  expandMemoryIsoSlotsToPickerCells,
  expandTwinSlotOptionsToPickerCells,
  visibleDatesFromPickerCells,
} from "@/lib/meetingCalendarSync";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatSlot(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function BookingPickGrid({
  dates,
  timeSlots,
  cellLookup,
  selectedPickId,
  onSelectCell,
}: {
  dates: Date[];
  timeSlots: string[];
  cellLookup: Map<string, { pickId: string; slotStartIso: string }>;
  selectedPickId: string;
  onSelectCell: (pickId: string, slotStartIso: string) => void;
}) {
  return (
    <div className="overflow-x-auto max-h-[min(62vh,560px)] rounded-xl border border-border bg-card/40">
      <div
        className="grid min-w-[520px] sm:min-w-[600px] md:min-w-[720px]"
        style={{
          gridTemplateColumns: `52px repeat(${dates.length}, minmax(82px, 1fr))`,
        }}
      >
        <div className="border-b border-r border-border bg-background px-1 py-2" />
        {dates.map((date) => (
          <div
            key={dateKeyLocal(date)}
            className="border-b border-r border-border bg-background px-1.5 py-2 text-center"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {date.toLocaleDateString([], { weekday: "short" })}
            </div>
            <div className="text-base font-bold tabular-nums">{date.getDate()}</div>
          </div>
        ))}

        {timeSlots.map((slot) => (
          <Fragment key={slot}>
            <div className="border-r border-b border-border bg-background px-1 py-2 text-[10px] text-muted-foreground tabular-nums">
              {slot}
            </div>
            {dates.map((date) => {
              const dKey = dateKeyLocal(date);
              const cellKey = `${dKey}_${slot}`;
              const meta = cellLookup.get(cellKey);
              const isOpen = !!meta;
              const isSelected = isOpen && meta.pickId === selectedPickId;
              return (
                <button
                  key={cellKey}
                  type="button"
                  disabled={!isOpen}
                  onClick={() => {
                    if (!meta) return;
                    onSelectCell(meta.pickId, meta.slotStartIso);
                  }}
                  className={cn(
                    "relative min-h-[44px] border-r border-b border-border px-0.5 py-0.5 text-left transition-colors",
                    !isOpen && "bg-muted/20 cursor-default",
                    isOpen && !isSelected && "cursor-pointer bg-success-soft/70 hover:bg-success-soft border-success/30",
                    isSelected && "cursor-pointer z-[1] bg-primary/20 ring-2 ring-inset ring-primary border-primary/50"
                  )}
                >
                  {isOpen ? (
                    <span className="sr-only">Select in-person trial slot {cellKey}</span>
                  ) : null}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const LeadBooking = () => {
  const { token } = useParams<{ token: string }>();
  const safeToken = (token ?? "").trim();
  const [selected, setSelected] = useState("");
  const [selectedStartIso, setSelectedStartIso] = useState("");

  const q = useQuery({
    queryKey: ["booking-session", safeToken],
    queryFn: () => getBookingSession(safeToken),
    enabled: safeToken.length > 0,
  });

  const mutation = useMutation({
    mutationFn: async (vars: { mode: "twin" | "memory"; selected: string; twinRowStartsAt?: string }) => {
      if (vars.mode === "twin") {
        const n = Number(vars.selected);
        const slotId = Number.isFinite(n) && String(n) === vars.selected ? n : vars.selected;
        return confirmBooking(safeToken, {
          slot_id: slotId,
          slot_start: vars.twinRowStartsAt ?? "",
        });
      }
      return confirmBookingSlot(safeToken, vars.selected);
    },
    onSuccess: () => {
      toast.success("In-person trial confirmed — check your email for next steps.");
      void q.refetch();
    },
    onError: (e: Error) => toast.error(e.message || "Could not confirm"),
  });

  const twinSlots = q.data?.twin_slots ?? [];

  const sortedMemorySlots = useMemo(() => {
    const slots = q.data?.available_slots ?? [];
    return [...slots].sort((a, b) => a.localeCompare(b));
  }, [q.data?.available_slots]);

  const sortedTwinSlots = useMemo(() => {
    return [...twinSlots].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [twinSlots]);

  const useTwinUi = sortedTwinSlots.length > 0;

  const pickerCells = useMemo(
    () =>
      useTwinUi
        ? expandTwinSlotOptionsToPickerCells(sortedTwinSlots)
        : expandMemoryIsoSlotsToPickerCells(sortedMemorySlots),
    [useTwinUi, sortedTwinSlots, sortedMemorySlots]
  );

  const visibleDates = useMemo(() => visibleDatesFromPickerCells(pickerCells), [pickerCells]);
  const cellLookup = useMemo(() => buildPickerCellLookup(pickerCells), [pickerCells]);
  const hasCalendar = pickerCells.length > 0;

  if (!safeToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <p className="text-muted-foreground">Invalid booking link.</p>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Link not found</CardTitle>
            <CardDescription>
              This scheduling link may be invalid or expired. Ask your rep for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { display_name, company, booking_confirmed, selected_slot } = q.data;

  if (booking_confirmed && selected_slot) {
    return (
      <div className="flex min-h-screen items-start justify-center bg-gradient-to-b from-background to-muted p-0 sm:items-center sm:p-4">
        <Card className="h-[100dvh] w-full rounded-none border-0 shadow-none sm:h-auto sm:max-w-lg sm:rounded-xl sm:border sm:border-primary/20 sm:shadow-lg">
          <CardHeader className="pt-8 sm:pt-6">
            <CardTitle className="text-xl sm:text-2xl">You’re booked for a trial</CardTitle>
            <CardDescription>
              Hi {display_name}
              {company ? ` · ${company}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-base sm:text-lg">
            <p>
              <span className="text-muted-foreground">Time: </span>
              <span className="font-medium">{formatSlot(selected_slot)}</span>
            </p>
            <p className="text-sm text-muted-foreground">Check your inbox for visit details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-b from-background to-muted p-0 sm:items-center sm:p-4">
      <Card className="h-[100dvh] w-full rounded-none border-0 shadow-none sm:h-auto sm:max-w-[960px] sm:rounded-xl sm:border sm:border-primary/15 sm:shadow-lg">
        <CardHeader className="px-4 pt-6 sm:px-6 sm:pt-6">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Etac</p>
          <CardTitle className="text-xl sm:text-2xl">Book an in-person trial</CardTitle>
          <CardDescription>
            Hi {display_name}
            {company ? ` · ${company}` : ""} — choose a time below (same calendar as our team). Tap a green slot, then confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-5 sm:space-y-6 sm:px-6 sm:pb-6">
          {hasCalendar ? (
            <>
              <p className="text-xs text-muted-foreground sm:hidden">Swipe sideways to see more dates.</p>
              <BookingPickGrid
                dates={visibleDates}
                timeSlots={SALES_HALF_HOUR_SLOTS}
                cellLookup={cellLookup}
                selectedPickId={selected}
                onSelectCell={(pickId, iso) => {
                  setSelected(pickId);
                  setSelectedStartIso(iso);
                }}
              />
              {selected ? (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{formatSlot(selectedStartIso || selected)}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Tap a green cell to pick your visit time.</p>
              )}
              <Button
                className="w-full sm:static sticky bottom-0 z-10"
                size="lg"
                disabled={!selected || mutation.isPending}
                onClick={() => {
                  if (!selected) return;
                  if (useTwinUi) {
                    const row = sortedTwinSlots.find((s) => String(s.id) === selected);
                    mutation.mutate({
                      mode: "twin",
                      selected,
                      twinRowStartsAt: row?.starts_at ?? selectedStartIso,
                    });
                  } else {
                    mutation.mutate({ mode: "memory", selected });
                  }
                }}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Confirm trial"
                )}
              </Button>
            </>
          ) : sortedMemorySlots.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                Slots could not be placed on the calendar grid; pick from the list.
              </p>
              <RadioGroup value={selected} onValueChange={setSelected} className="gap-3">
                {sortedMemorySlots.map((slot) => (
                  <div
                    key={slot}
                    className="flex items-center space-x-3 rounded-lg border border-border/80 bg-card/50 px-3 py-3"
                  >
                    <RadioGroupItem value={slot} id={slot} />
                    <Label htmlFor={slot} className="flex-1 cursor-pointer font-normal">
                      {formatSlot(slot)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                className="w-full sm:static sticky bottom-0 z-10"
                size="lg"
                disabled={!selected || mutation.isPending}
                onClick={() => selected && mutation.mutate({ mode: "memory", selected })}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Confirm trial"
                )}
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground">
              No trial slots open yet. Your rep will share new times soon.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadBooking;
