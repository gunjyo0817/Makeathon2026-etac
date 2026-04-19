import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductSelector } from "@/components/sales/ProductSelector";
import { agents, getAgentByProductId, products } from "@/data/mock";
import { Bot, Pause, Play, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Agents() {
  const [searchParams] = useSearchParams();
  const [productId, setProductId] = useState("all");
  const [statuses, setStatuses] = useState<Record<string, "active" | "paused">>(() =>
    Object.fromEntries(agents.map((agent) => [agent.id, agent.status]))
  );
  const [agentOverrides, setAgentOverrides] = useState<Record<string, (typeof agents)[number]>>({});
  useEffect(() => {
    const productIdFromQuery = searchParams.get("productId");
    if (productIdFromQuery && products.some((product) => product.id === productIdFromQuery)) {
      setProductId(productIdFromQuery);
    }
  }, [searchParams]);

  const visibleAgents = productId === "all"
    ? agents.map((a) => agentOverrides[a.id] ?? a)
    : (() => { const b = getAgentByProductId(productId); return b ? [agentOverrides[b.id] ?? b] : []; })();

  const toggleStatus = (agentId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [agentId]: prev[agentId] === "active" ? "paused" : "active",
    }));
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 pb-8 pt-2 sm:gap-7 sm:px-6 sm:pb-10 lg:px-8">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agents</h1>
            <p className="text-muted-foreground mt-2 text-sm">Each product can have a dedicated assistant for lead outreach, quoting, and follow-up.</p>
          </div>
          <ProductSelector selectedId={productId} onSelect={setProductId} includeAll />
        </header>


        {visibleAgents.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-10 text-center text-sm text-muted-foreground">
            No assistant is configured for this product yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleAgents.map((agent) => {
              const status = statuses[agent.id] ?? agent.status;
              const isActive = status === "active";
              return (
                <article key={agent.id} className="bg-card border border-border rounded-3xl p-5 shadow-card flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="size-11 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-sm">{agent.initials}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold leading-none">{agent.name}</h3>
                          <span
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full",
                              isActive ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">{agent.role}</div>
                        <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                      </div>
                    </div>
                    <Bot className="size-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <Row label="Channels" value={agent.channels.join(", ")} />
                    <Row label="Voice" value={agent.voice} />
                    <Row label="Personality" value={agent.personality} italic />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => toggleStatus(agent.id)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors",
                        isActive ? "bg-muted hover:bg-muted/70" : "bg-primary text-primary-foreground hover:opacity-90"
                      )}
                    >
                      {isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                      {isActive ? "Pause" : "Activate"}
                    </button>
                    <ConfigureAgentDialog
                      agent={agent}
                      onSave={(updatedAgent) =>
                        setAgentOverrides((prev) => ({
                          ...prev,
                          [updatedAgent.id]: updatedAgent,
                        }))
                      }
                    />
                    <button className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                      <Sparkles className="size-4" />
                      Train
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ConfigureAgentDialog({
  agent,
  onSave,
}: {
  agent: (typeof agents)[number];
  onSave: (agent: (typeof agents)[number]) => void;
}) {
  const [draft, setDraft] = useState(agent);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setDraft(agent);
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">
          <Settings2 className="size-4" />
          Configure
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Configure {agent.name}</DialogTitle>
          <DialogDescription>Product-bound assistant settings for outreach, quoting, and lead follow-up.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Agent name">
            <Input value={agent.name} disabled />
          </Field>
          <Field label="Role">
            <Input value={agent.role} disabled />
          </Field>
          <Field label="Voice">
            <Input value={draft.voice} onChange={(e) => setDraft({ ...draft, voice: e.target.value })} />
          </Field>
          <Field label="Channels">
            <Input value={agent.channels.join(", ")} disabled />
          </Field>
        </div>

        <Field label="Personality">
          <textarea
            rows={3}
            value={draft.personality}
            onChange={(e) => setDraft({ ...draft, personality: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </Field>

        <DialogFooter>
          <DialogClose asChild>
            <button className="px-4 py-2 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
          </DialogClose>
          <DialogClose asChild>
            <button
              onClick={() => onSave(draft)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Save configuration
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



function Row({ label, value, italic = false }: { label: string; value: string; italic?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-24 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold shrink-0 pt-0.5">{label}</div>
      <div className={cn("text-sm", italic && "italic text-muted-foreground")}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}
