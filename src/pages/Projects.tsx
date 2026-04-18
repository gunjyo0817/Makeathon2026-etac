import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { projects, leads, STATUS_COLUMNS } from "@/data/mock";
import { FolderKanban, ArrowRight, Plus, Users, TrendingUp } from "lucide-react";

export default function Projects() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Each project is an independent campaign with its own leads, agents, and pipeline.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-clay hover:opacity-90 transition-opacity">
            <Plus className="size-4" /> New Project
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => {
            const projectLeads = leads.filter((l) => l.projectId === p.id);
            const qualified = projectLeads.filter((l) => l.status === "qualified" || l.status === "meeting").length;
            const conv = projectLeads.length ? Math.round((qualified / projectLeads.length) * 100) : 0;

            return (
              <button
                key={p.id}
                onClick={() => navigate("/")}
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
                  <Stat icon={Users} label="Leads" value={projectLeads.length} />
                  <Stat icon={TrendingUp} label="Qualified" value={qualified} />
                  <Stat label="Conv." value={`${conv}%`} />
                </div>

                <div className="flex gap-1">
                  {STATUS_COLUMNS.map((c) => {
                    const count = projectLeads.filter((l) => l.status === c.id).length;
                    const pct = projectLeads.length ? (count / projectLeads.length) * 100 : 0;
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
