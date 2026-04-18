import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { products, leads, STATUS_COLUMNS } from "@/data/mock";
import { FolderKanban, ArrowRight, Plus, Users, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Products() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    objective: "",
    price: "",
    texture: "",
  });

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Browse furniture pieces with structured details, materials, and sales context.
            </p>
          </div>
          <Dialog
            onOpenChange={(open) => {
              if (open) {
                setDraft({
                  name: "",
                  description: "",
                  objective: "",
                  price: "",
                  texture: "",
                });
              }
            }}
          >
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-clay hover:opacity-90 transition-opacity">
                <Plus className="size-4" /> New Product
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-3xl border-border bg-card/95 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Create New Product</DialogTitle>
              </DialogHeader>

              <Field label="Product name">
                <Input
                  placeholder="Linden Lounge Chair"
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Price">
                  <Input
                    type="number"
                    placeholder="1299"
                    value={draft.price}
                    onChange={(e) => setDraft((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </Field>

                <Field label="Texture">
                  <Input
                    placeholder="Boucle fabric"
                    value={draft.texture}
                    onChange={(e) => setDraft((prev) => ({ ...prev, texture: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Short description">
                <textarea
                  rows={3}
                  placeholder="A sculpted accent chair with a low profile and wrapped upholstery for calm, modern interiors."
                  value={draft.description}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </Field>

              <Field label="Product notes">
                <textarea
                  rows={4}
                  placeholder="Designed for boutique hotel lounges, reading corners, and warm residential spaces."
                  value={draft.objective}
                  onChange={(e) => setDraft((prev) => ({ ...prev, objective: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </Field>

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Preview</div>
                <div className="mt-2 text-base font-bold">{draft.name || "Untitled product"}</div>
                <div className="mt-1 text-sm text-muted-foreground">{draft.description || "Short description will appear here."}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-card border border-border px-3 py-1 text-xs font-semibold text-foreground">
                    {draft.price ? `$${draft.price}` : "Price"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-card border border-border px-3 py-1 text-xs font-semibold text-foreground">
                    {draft.texture || "Texture"}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <button className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                    Cancel
                  </button>
                </DialogClose>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold opacity-60 cursor-not-allowed"
                >
                  Create Product
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((p) => {
            const productLeads = leads.filter((l) => l.productId === p.id);
            const qualified = productLeads.filter((l) => l.status === "qualified" || l.status === "meeting").length;
            const conv = productLeads.length ? Math.round((qualified / productLeads.length) * 100) : 0;

            return (
              <button
                key={p.id}
                onClick={() => navigate(`/products/${p.id}`)}
                className="text-left bg-card border border-border rounded-3xl p-6 shadow-card hover:shadow-clay hover:-translate-y-0.5 hover:border-primary/40 transition-all group flex flex-col gap-5"
              >
                <div className="flex items-start justify-between">
                  <div className="size-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center">
                    <FolderKanban className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                  <div className="font-bold tracking-tight text-lg leading-tight group-hover:text-primary transition-colors">{p.name}</div>
                  <div className="text-sm text-muted-foreground mt-1.5 text-pretty">{p.description}</div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                  <Stat icon={Users} label="Leads" value={productLeads.length} />
                  <Stat icon={TrendingUp} label="Qualified" value={qualified} />
                  <Stat label="Interest" value={`${conv}%`} />
                </div>

                <div className="flex gap-1">
                  {STATUS_COLUMNS.map((c) => {
                    const count = productLeads.filter((l) => l.status === c.id).length;
                    const pct = productLeads.length ? (count / productLeads.length) * 100 : 0;
                    return <div key={c.id} className="h-1.5 rounded-full bg-primary/60" style={{ flex: pct || 0.05 }} title={`${c.label}: ${count}`} />;
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon?: any; label: string; value: number | string }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {Icon && <Icon className="size-3" />}
        {label}
      </div>
      <div className="text-lg font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}
