import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectSelector } from "@/components/sales/ProjectSelector";
import { agents, getAgentByProjectId, projectAgentConfigs, projects } from "@/data/mock";
import { Bot, Pause, Play, Settings2, Sparkles, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Agents() {
  const [projectId, setProjectId] = useState(projects[0].id);
  const [statuses, setStatuses] = useState<Record<string, "active" | "paused">>(() =>
    Object.fromEntries(agents.map((agent) => [agent.id, agent.status]))
  );

  const agent = getAgentByProjectId(projectId);
  const config = projectAgentConfigs[projectId];

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
            <p className="text-muted-foreground mt-2 text-sm">One project, one dedicated AI agent with project-specific persona and API routing.</p>
          </div>
          <ProjectSelector selectedId={projectId} onSelect={setProjectId} />
        </header>

        <div className="bg-card border border-border rounded-3xl p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project Persona</div>
            <div className="text-sm mt-1.5 leading-relaxed">{config?.persona}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Project Knowledge Context</div>
            <div className="text-sm mt-1.5 leading-relaxed">{config?.dataKnowledge}</div>
          </div>
        </div>

        {!agent ? (
          <div className="bg-card border border-border rounded-3xl p-10 text-center text-sm text-muted-foreground">
            No agent configured for this project yet.
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
                    <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">
                      <Settings2 className="size-4" />
                      Configure
                    </button>
                    <button className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
                      <Phone className="size-4" />
                      Test Happy Call
                    </button>
                    <button className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80 transition-opacity">
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
