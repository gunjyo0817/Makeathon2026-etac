import { projects } from "@/data/mock";
import { ChevronDown, Check, FolderKanban } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ProjectSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];

  useEffect(() => {
    if (!open) return;

    const updateDropdownAlignment = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 320; // w-80
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - rect.left;
      const spaceOnLeft = rect.right;

      // If opening to the right would overflow, anchor to the right edge.
      setAlignEnd(spaceOnRight < menuWidth && spaceOnLeft > spaceOnRight);
    };

    updateDropdownAlignment();
    window.addEventListener("resize", updateDropdownAlignment);
    return () => window.removeEventListener("resize", updateDropdownAlignment);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-2.5 shadow-soft hover:border-primary/40 transition-colors"
      >
        <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
          <FolderKanban className="size-4" />
        </div>
        <div className="text-left min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold leading-none">Active Project</div>
          <div className="text-sm font-semibold mt-0.5 truncate">{selected.name}</div>
        </div>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute z-20 mt-2 w-80 bg-popover border border-border rounded-2xl shadow-card p-2 animate-fade-in",
              alignEnd ? "right-0" : "left-0"
            )}
          >
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-start gap-3 p-3 rounded-xl transition-colors",
                  p.id === selectedId ? "bg-primary-soft" : "hover:bg-muted"
                )}
              >
                <div className="size-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0">
                  <FolderKanban className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{p.name}</div>
                    {p.id === selectedId && <Check className="size-4 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 text-pretty">{p.description}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">{p.leadCount} leads</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
