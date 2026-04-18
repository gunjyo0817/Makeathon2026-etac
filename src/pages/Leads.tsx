import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { leads, projects, STATUS_COLUMNS, type LeadStatus, type Temperature } from "@/data/mock";
import { StatusBadge, TemperatureBadge } from "@/components/sales/Badges";
import { timeAgo } from "@/lib/format";
import { Search, Filter, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TEMPS: { id: Temperature | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
];

export default function Leads() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [temp, setTemp] = useState<Temperature | "all">("all");
  const [status, setStatus] = useState<LeadStatus | "all">("all");

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (temp !== "all" && l.temperature !== temp) return false;
      if (status !== "all" && l.status !== status) return false;
      if (q && !`${l.name} ${l.company} ${l.role}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, temp, status]);

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-6 max-w-[1600px] mx-auto">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {filtered.length} of {leads.length} leads across all projects.
          </p>
        </header>

        <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, company, role…"
                className="w-full h-10 pl-9 pr-4 rounded-full bg-muted border border-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              {TEMPS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemp(t.id)}
                  className={cn(
                    "px-3 h-8 rounded-full text-xs font-semibold transition-colors",
                    temp === t.id ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus | "all")}
              className="h-10 px-3 rounded-full bg-muted text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All stages</option>
              {STATUS_COLUMNS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>

            <button className="ml-auto inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Filter className="size-4" /> More filters
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-semibold px-5 py-3">Lead</th>
                  <th className="text-left font-semibold px-5 py-3">Company</th>
                  <th className="text-left font-semibold px-5 py-3">Project</th>
                  <th className="text-left font-semibold px-5 py-3">Stage</th>
                  <th className="text-left font-semibold px-5 py-3">Temp</th>
                  <th className="text-right font-semibold px-5 py-3">Intent</th>
                  <th className="text-right font-semibold px-5 py-3">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const project = projects.find((p) => p.id === l.projectId);
                  return (
                    <tr
                      key={l.id}
                      onClick={() => navigate(`/leads/${l.id}`)}
                      className="border-b border-border last:border-0 hover:bg-muted/60 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-full bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                            {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold leading-tight truncate">{l.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{l.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Building2 className="size-3.5 text-muted-foreground" />
                          {l.company}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{project?.name}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={l.status} /></td>
                      <td className="px-5 py-3.5"><TemperatureBadge temp={l.temperature} /></td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold">
                        {l.intentScore}<span className="text-muted-foreground font-normal text-xs">/100</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-muted-foreground">{timeAgo(l.lastInteractionAt)}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No leads match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
