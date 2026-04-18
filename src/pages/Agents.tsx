import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectSelector } from "@/components/sales/ProjectSelector";
import { agents, getAgentByProjectId, projectAgentConfigs, projects } from "@/data/mock";
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
  const [projectId, setProjectId] = useState(projects[0].id);
  const [statuses, setStatuses] = useState<Record<string, "active" | "paused">>(() =>
    Object.fromEntries(agents.map((agent) => [agent.id, agent.status]))
  );
  const [agentOverrides, setAgentOverrides] = useState<Record<string, (typeof agents)[number]>>({});
  const [configOverrides, setConfigOverrides] = useState(projectAgentConfigs);

  useEffect(() => {
    const projectIdFromQuery = searchParams.get("projectId");
    if (projectIdFromQuery && projects.some((project) => project.id === projectIdFromQuery)) {
      setProjectId(projectIdFromQuery);
    }
  }, [searchParams]);

  const baseAgent = getAgentByProjectId(projectId);
  const agent = baseAgent ? agentOverrides[baseAgent.id] ?? baseAgent : undefined;
  const config = configOverrides[projectId];

  const toggleStatus = (agentId: string) => {
    setStatuses((prev) => ({
      ...prev,
      [agentId]: prev[agentId] === "active" ? "paused" : "active",
    }));
  };

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground mt-2 text-sm">Each product can have a dedicated assistant for buyer outreach, quoting, and follow-up.</p>
          </div>
          <ProjectSelector selectedId={projectId} onSelect={setProjectId} />
        </header>

        <div className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center justify-end mb-3">
            <ConfigureProjectContextDialog
              persona={config?.persona ?? ""}
              dataKnowledge={config?.dataKnowledge ?? ""}
              onSave={(next) =>
                setConfigOverrides((prev) => ({
                  ...prev,
                  [projectId]: {
                    ...(prev[projectId] ?? projectAgentConfigs[projectId]),
                    persona: next.persona,
                    dataKnowledge: next.dataKnowledge,
                  },
                }))
              }
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product Voice</div>
              <div className="text-sm mt-1.5 leading-relaxed">{config?.persona}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product Knowledge</div>
              <div className="text-sm mt-1.5 leading-relaxed">{config?.dataKnowledge}</div>
            </div>
          </div>
        </div>

        {!agent ? (
          <div className="bg-card border border-border rounded-3xl p-10 text-center text-sm text-muted-foreground">
            No assistant is configured for this product yet.
          </div>
        ) : (
          <article className="bg-card border border-border rounded-3xl p-5 shadow-card flex flex-col gap-4">
            {(() => {
              const status = statuses[agent.id] ?? agent.status;
              const isActive = status === "active";
              return (
                <>
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

                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Conversations" value={agent.conversations.toLocaleString()} />
                    <Stat label="Meetings" value={agent.meetings.toLocaleString()} emphasis />
                    <Stat label="Qual Rate" value={`${agent.qualRate}%`} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <Row label="Channels" value={agent.channels.join(", ")} />
                    <Row label="Voice" value={agent.voice} />
                    <Row label="Personality" value={agent.personality} italic />
                    <Row label="HappyRobot API" value={agent.happyRobot.apiBaseUrl} />
                    <Row label="Agent Ref" value={agent.happyRobot.agentRef} />
                    <Row label="Phone Calls" value={agent.happyRobot.phoneEnabled ? "Enabled" : "Disabled"} />
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
                </>
              );
            })()}
          </article>
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
          <DialogDescription>Product-bound assistant settings for outreach, quoting, and buyer follow-up.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Agent name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Role">
            <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
          </Field>
          <Field label="Voice">
            <Input value={draft.voice} onChange={(e) => setDraft({ ...draft, voice: e.target.value })} />
          </Field>
          <Field label="Channels (comma-separated)">
            <Input
              value={draft.channels.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  channels: e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                })
              }
            />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Happy Robot API base URL">
            <Input
              value={draft.happyRobot.apiBaseUrl}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  happyRobot: { ...draft.happyRobot, apiBaseUrl: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Happy Robot agent ref">
            <Input
              value={draft.happyRobot.agentRef}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  happyRobot: { ...draft.happyRobot, agentRef: e.target.value },
                })
              }
            />
          </Field>
        </div>

        <button
          onClick={() =>
            setDraft({
              ...draft,
              happyRobot: { ...draft.happyRobot, phoneEnabled: !draft.happyRobot.phoneEnabled },
            })
          }
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-colors text-sm"
        >
          <span className="font-medium">Enable phone calls via Happy Robot</span>
          <span className={cn("text-xs font-semibold", draft.happyRobot.phoneEnabled ? "text-success" : "text-muted-foreground")}>
            {draft.happyRobot.phoneEnabled ? "Enabled" : "Disabled"}
          </span>
        </button>

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

function ConfigureProjectContextDialog({
  persona,
  dataKnowledge,
  onSave,
}: {
  persona: string;
  dataKnowledge: string;
  onSave: (payload: { persona: string; dataKnowledge: string }) => void;
}) {
  const [draft, setDraft] = useState({ persona, dataKnowledge });

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setDraft({ persona, dataKnowledge });
      }}
    >
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-colors">
          <Settings2 className="size-3.5" />
          Edit
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Product Assistant Context</DialogTitle>
          <DialogDescription>Product-level instructions used by the assigned assistant.</DialogDescription>
        </DialogHeader>

        <Field label="Product voice">
          <textarea
            rows={5}
            value={draft.persona}
            onChange={(e) => setDraft((prev) => ({ ...prev, persona: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </Field>

        <Field label="Knowledge context">
          <textarea
            rows={5}
            value={draft.dataKnowledge}
            onChange={(e) => setDraft((prev) => ({ ...prev, dataKnowledge: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
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
              Save context
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border p-3", emphasis && "bg-destructive/5 border-destructive/20")}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-2xl leading-none font-bold tabular-nums mt-2">{value}</div>
    </div>
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
