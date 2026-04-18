import { useState } from "react";
import { Pause, Play, UserCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function ControlPanel({ initialPaused }: { initialPaused: boolean }) {
  const [paused, setPaused] = useState(initialPaused);

  return (
    <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
        <div className="size-8 rounded-lg bg-warning-soft text-warning flex items-center justify-center">
          <ShieldAlert className="size-4" />
        </div>
        <div>
          <div className="text-sm font-bold leading-none">Control Panel</div>
          <div className="text-[11px] text-muted-foreground mt-1">Override or supervise Etac's lead-facing actions</div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div
          className={cn(
            "rounded-2xl p-3 flex items-center gap-3 border transition-colors",
            paused ? "bg-warning-soft/60 border-warning/30" : "bg-success-soft/60 border-success/30"
          )}
        >
          <div className={cn("size-2.5 rounded-full animate-pulse-soft", paused ? "bg-warning" : "bg-success")} />
          <div className="text-xs font-semibold flex-1">
            {paused ? "Assistant paused — no automated actions will run." : "Assistant active — managing this lead conversation autonomously."}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setPaused((v) => !v)}
            className="bg-muted hover:bg-secondary border border-border rounded-2xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {paused ? <><Play className="size-3.5" /> Resume Assistant</> : <><Pause className="size-3.5" /> Pause Assistant</>}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-2xl px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-soft",
              /* Opaque fills: bg-foreground + text-background fails here because --background uses alpha and reads as dark-on-dark */
              "bg-[hsl(222_62%_38%)] text-white hover:bg-[hsl(222_62%_32%)]",
              "dark:bg-[hsl(222_55%_52%)] dark:text-white dark:hover:bg-[hsl(222_55%_46%)]"
            )}
          >
            <UserCheck className="size-3.5 shrink-0" />
            Take Over
          </button>
        </div>
      </div>
    </div>
  );
}
