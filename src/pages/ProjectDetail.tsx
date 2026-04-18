import { useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import {
  conversationsNeedingAttention,
  getAgentByProjectId,
  getProjectById,
  leads,
  projectAgentConfigs,
  STATUS_COLUMNS,
} from "@/data/mock";
import { StatusBadge, TemperatureBadge } from "@/components/sales/Badges";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock3,
  MessageSquareMore,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectLeadsRef = useRef<HTMLElement | null>(null);
  const project = id ? getProjectById(id) : undefined;

  const projectLeads = useMemo(() => leads.filter((lead) => lead.projectId === id), [id]);
  const attentionItems = useMemo(
    () => conversationsNeedingAttention.filter((item) => item.projectId === id),
    [id]
  );

  if (!project || !id) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-card">
            <h2 className="text-lg font-bold">Project not found</h2>
            <p className="text-sm text-muted-foreground mt-2">The project you're looking for doesn't exist.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const agent = getAgentByProjectId(project.id);
  const config = projectAgentConfigs[project.id];
  const meetings = projectLeads.flatMap((lead) => lead.meetings);
  const activeLeads = projectLeads.filter((lead) => lead.status !== "closed");
  const qualifiedLeads = projectLeads.filter((lead) => lead.status === "qualified" || lead.status === "meeting");
  const respondedLeads = projectLeads.filter(
    (lead) => lead.status === "responded" || lead.status === "qualified" || lead.status === "meeting"
  );
  const responseRate = projectLeads.length ? Math.round((respondedLeads.length / projectLeads.length) * 100) : 0;
  const qualificationRate = projectLeads.length ? Math.round((qualifiedLeads.length / projectLeads.length) * 100) : 0;
  const avgIntent = projectLeads.length
    ? Math.round(projectLeads.reduce((sum, lead) => sum + lead.intentScore, 0) / projectLeads.length)
    : 0;
  const hottestLead = [...projectLeads].sort((a, b) => b.intentScore - a.intentScore)[0];

  const workflowSteps = [
    {
      title: "Project setup",
      description: config ? "Agent persona, message limits, and routing rules are configured." : "Project setup is still incomplete.",
      complete: Boolean(config),
    },
    {
      title: "Outreach live",
      description: activeLeads.length > 0 ? `${activeLeads.length} leads are actively being worked.` : "No active outreach yet.",
      complete: activeLeads.length > 0,
    },
    {
      title: "Qualification underway",
      description: qualifiedLeads.length > 0 ? `${qualifiedLeads.length} leads are already qualified or booked.` : "Qualification has not started yet.",
      complete: qualifiedLeads.length > 0,
    },
    {
      title: "Meetings generated",
      description: meetings.length > 0 ? `${meetings.length} meetings have been created for this project.` : "No meetings have been generated yet.",
      complete: meetings.length > 0,
    },
    {
      title: "Optimization loop",
      description: attentionItems.length > 0 ? `${attentionItems.length} conversations currently need manual review.` : "No urgent issues; project is running cleanly.",
      complete: attentionItems.length === 0 && activeLeads.length > 0,
      warning: attentionItems.length > 0,
    },
  ];

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <button
              onClick={() => navigate("/projects")}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Projects
            </button>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="size-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-3xl text-pretty">{project.description}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <SummaryPill
              icon={Users}
              label="Project reach"
              value={`${projectLeads.length} leads`}
              onClick={() => projectLeadsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
            <SummaryPill
              icon={CalendarRange}
              label="Meetings"
              value={`${meetings.length} booked`}
              onClick={() => navigate(`/meetings?projectId=${project.id}`)}
            />
            <SummaryPill icon={MessageSquareMore} label="Response rate" value={`${responseRate}%`} />
          </div>
        </header>

        <section>
          <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                <Building2 className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold leading-none">Project Overview</div>
                <div className="text-[11px] text-muted-foreground mt-1">Core context and operating model</div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard label="Project scope" value={project.description} />
              <InfoCard
                label="Assigned agent"
                value={agent ? `${agent.name} · ${agent.role}` : "No agent assigned"}
                onClick={agent ? () => navigate(`/agents?projectId=${project.id}`) : undefined}
              />
              <InfoCard label="Project objective" value={project.objective} />
              <InfoCard label="Execution mode" value={config?.autoEngage ? "Autonomous with human escalation" : "Human-supervised execution"} />
            </div>
          </div>
        </section>

        <section ref={projectLeadsRef} className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold leading-none">Project Leads</div>
              <div className="text-[11px] text-muted-foreground mt-1">Lead roster within this project. Use this section for contact-level follow-up.</div>
            </div>
          </div>
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <div className="flex flex-wrap gap-2">
              {STATUS_COLUMNS.map((column) => {
                const count = projectLeads.filter((lead) => lead.status === column.id).length;
                return (
                  <span key={column.id} className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span className="text-foreground">{column.label}</span>
                    <span>{count}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-semibold px-5 py-3">Lead</th>
                  <th className="text-left font-semibold px-5 py-3">Company</th>
                  <th className="text-left font-semibold px-5 py-3">Stage</th>
                  <th className="text-left font-semibold px-5 py-3">Temp</th>
                  <th className="text-right font-semibold px-5 py-3">Intent</th>
                  <th className="text-right font-semibold px-5 py-3">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {projectLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="border-b border-border last:border-0 hover:bg-muted/60 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                          {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight truncate">{lead.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{lead.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="size-3.5 text-muted-foreground" />
                        {lead.company}
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={lead.status} /></td>
                    <td className="px-5 py-3.5"><TemperatureBadge temp={lead.temperature} /></td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                      {lead.intentScore}<span className="text-muted-foreground font-normal text-xs">/100</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">{timeAgo(lead.lastInteractionAt)}</td>
                  </tr>
                ))}
                {projectLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No leads in this project yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <div className="text-sm font-bold leading-none">Project Performance Summary</div>
            <div className="text-[11px] text-muted-foreground mt-1">High-level outcomes for this campaign, independent of any single lead.</div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <PerformanceCard
              icon={MessageSquareMore}
              label="Response rate"
              value={`${responseRate}%`}
              detail={`${respondedLeads.length} of ${projectLeads.length} leads replied or advanced`}
            />
            <PerformanceCard
              icon={CheckCircle2}
              label="Qualification rate"
              value={`${qualificationRate}%`}
              detail={`${qualifiedLeads.length} leads are qualified or scheduled`}
            />
            <PerformanceCard
              icon={Clock3}
              label="Average intent"
              value={`${avgIntent}/100`}
              detail={hottestLead ? `Strongest signal: ${hottestLead.name}` : "No intent data yet"}
            />
            <PerformanceCard
              icon={TriangleAlert}
              label="Needs attention"
              value={`${attentionItems.length}`}
              detail={attentionItems.length > 0 ? "Manual intervention recommended on open threads" : "No urgent project-level blockers"}
              tone={attentionItems.length > 0 ? "warning" : "success"}
            />
          </div>
        </section>

        <section>
          <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="text-sm font-bold leading-none">Project Workflow</div>
              <div className="text-[11px] text-muted-foreground mt-1">Where this campaign currently sits operationally.</div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "size-9 rounded-full flex items-center justify-center border text-xs font-bold shrink-0",
                        step.warning
                          ? "border-warning/30 bg-warning-soft text-warning"
                          : step.complete
                            ? "border-success/30 bg-success-soft text-success"
                            : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < workflowSteps.length - 1 && <div className="w-px flex-1 bg-border mt-2 min-h-8" />}
                  </div>
                  <div className="pt-1">
                    <div className="text-sm font-semibold">{step.title}</div>
                    <div className="text-sm text-muted-foreground mt-1 text-pretty">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SummaryPill({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft",
        onClick && "cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40"
      )}
    >
      <div className="size-9 rounded-xl bg-muted text-foreground flex items-center justify-center">
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-bold mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border bg-muted/35 p-4",
        onClick && "cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/60"
      )}
    >
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-semibold mt-2 leading-relaxed text-pretty">{value}</div>
    </div>
  );
}

function PerformanceCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
          <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
        <div
          className={cn(
            "size-10 rounded-xl flex items-center justify-center",
            tone === "warning"
              ? "bg-warning-soft text-warning"
              : tone === "success"
                ? "bg-success-soft text-success"
                : "bg-primary-soft text-primary"
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-3 leading-relaxed text-pretty">{detail}</div>
    </div>
  );
}
