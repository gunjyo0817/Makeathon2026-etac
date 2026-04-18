import { products as mockProducts } from "@/data/mock";
import { ChevronDown, Check, FolderKanban } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SelectorProduct = {
  id: string;
  name: string;
  description?: string;
  leadCount?: number;
};

export function ProductSelector({
  selectedId,
  onSelect,
  includeAll = false,
  products = mockProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    leadCount: product.leadCount,
  })),
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  includeAll?: boolean;
  products?: SelectorProduct[];
}) {
  const [open, setOpen] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedProduct = products.find((p) => p.id === selectedId);
  const displayName = selectedProduct ? selectedProduct.name : "All Products";

  useEffect(() => {
    if (!open) return;

    const updateDropdownAlignment = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = 320; // w-80
      const viewportWidth = window.innerWidth;
      const spaceOnRight = viewportWidth - rect.left;
      const spaceOnLeft = rect.right;

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
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold leading-none">Product</div>
          <div className="text-sm font-semibold mt-0.5 truncate">{displayName}</div>
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
            {includeAll && (
              <button
                onClick={() => {
                  onSelect("all");
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors",
                  selectedId === "all" ? "bg-primary-soft" : "hover:bg-muted"
                )}
              >
                <div className="size-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0">
                  <FolderKanban className="size-4" />
                </div>
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <div className="text-sm font-semibold">All Products</div>
                  {selectedId === "all" && <Check className="size-4 text-primary" />}
                </div>
              </button>
            )}
            {products.map((p) => (
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
