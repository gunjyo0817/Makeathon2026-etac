import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { confirmBooking, confirmBookingSlot, getBookingSession } from "@/lib/api";
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

const LeadBooking = () => {
  const { token } = useParams<{ token: string }>();
  const safeToken = (token ?? "").trim();
  const [selected, setSelected] = useState<string>("");

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
      toast.success("Time confirmed — check your email for next steps.");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-lg border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">You’re booked</CardTitle>
            <CardDescription>
              Hi {display_name}
              {company ? ` · ${company}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-lg">
            <p>
              <span className="text-muted-foreground">Time: </span>
              <span className="font-medium">{formatSlot(selected_slot)}</span>
            </p>
            <p className="text-sm text-muted-foreground">Check your inbox for confirmation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-lg border-primary/15 shadow-lg">
        <CardHeader>
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Etac</p>
          <CardTitle className="text-2xl">Pick a time</CardTitle>
          <CardDescription>
            Hi {display_name}
            {company ? ` · ${company}` : ""} — choose one slot below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {useTwinUi ? (
            sortedTwinSlots.length === 0 ? (
              <p className="text-muted-foreground">
                No open slots yet. Your sales rep will send updated times soon.
              </p>
            ) : (
              <>
                <RadioGroup value={selected} onValueChange={setSelected} className="gap-3">
                  {sortedTwinSlots.map((slot) => {
                    const sid = String(slot.id);
                    return (
                      <div
                        key={sid}
                        className="flex items-center space-x-3 rounded-lg border border-border/80 bg-card/50 px-3 py-3"
                      >
                        <RadioGroupItem value={sid} id={sid} />
                        <Label htmlFor={sid} className="flex-1 cursor-pointer font-normal">
                          {formatSlot(slot.starts_at)}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selected || mutation.isPending}
                  onClick={() => {
                    if (!selected) return;
                    const row = sortedTwinSlots.find((s) => String(s.id) === selected);
                    mutation.mutate({
                      mode: "twin",
                      selected,
                      twinRowStartsAt: row?.starts_at,
                    });
                  }}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    "Confirm time"
                  )}
                </Button>
              </>
            )
          ) : sortedMemorySlots.length === 0 ? (
            <p className="text-muted-foreground">
              No open slots yet. Your sales rep will send updated times soon.
            </p>
          ) : (
            <>
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
                className="w-full"
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
                  "Confirm time"
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadBooking;
