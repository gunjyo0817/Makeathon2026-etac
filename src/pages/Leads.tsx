import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { leads, projects, STATUS_COLUMNS, type LeadStatus, type Temperature } from "@/data/mock";
import { StatusBadge, TemperatureBadge } from "@/components/sales/Badges";
import { timeAgo } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type IntentFilter = "all" | "high" | "medium" | "low";
type ActivityFilter = "all" | "today" | "3d" | "7d" | "30d";

const TEMPS: { id: Temperature | "all"; label: string }[] = [
  { id: "all", label: "All temps" },
  { id: "hot", label: "Hot" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
];

const INTENT_OPTIONS: { id: IntentFilter; label: string }[] = [
  { id: "all", label: "All intents" },
  { id: "high", label: "High 80+" },
  { id: "medium", label: "Medium 50-79" },
  { id: "low", label: "Low below 50" },
];

const ACTIVITY_OPTIONS: { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "Any time" },
  { id: "today", label: "Today" },
  { id: "3d", label: "Last 3 days" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export default function Leads() {
  const navigate = useNavigate();
  const [leadQuery, setLeadQuery] = useState("");
  const [companyQuery, setCompanyQuery] = useState("");
  const [projectId, setProjectId] = useState<string>("all");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [temp, setTemp] = useState<Temperature | "all">("all");
  const [intentFilter, setIntentFilter] = useState<IntentFilter>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const hasActiveFilters =
    leadQuery !== "" ||
    companyQuery !== "" ||
    projectId !== "all" ||
    status !== "all" ||
    temp !== "all" ||
    intentFilter !== "all" ||
    activityFilter !== "all";

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const project = projects.find((p) => p.id === l.projectId);
      const ageDays = (Date.now() - new Date(l.lastInteractionAt).getTime()) / 86_400_000;

      if (leadQuery && !`${l.name} ${l.role}`.toLowerCase().includes(leadQuery.toLowerCase())) return false;
      if (companyQuery && !`${l.company} ${project?.name ?? ""}`.toLowerCase().includes(companyQuery.toLowerCase())) return false;
      if (projectId !== "all" && l.projectId !== projectId) return false;
      if (status !== "all" && l.status !== status) return false;
      if (temp !== "all" && l.temperature !== temp) return false;

      if (intentFilter === "high" && l.intentScore < 80) return false;
      if (intentFilter === "medium" && (l.intentScore < 50 || l.intentScore >= 80)) return false;
      if (intentFilter === "low" && l.intentScore >= 50) return false;

      if (activityFilter === "today" && ageDays >= 1) return false;
      if (activityFilter === "3d" && ageDays >= 3) return false;
      if (activityFilter === "7d" && ageDays >= 7) return false;
      if (activityFilter === "30d" && ageDays >= 30) return false;

      return true;
    });
  }, [activityFilter, companyQuery, intentFilter, leadQuery, projectId, status, temp]);

  const clearFilters = () => {
    setLeadQuery("");
    setCompanyQuery("");
    setProjectId("all");
    setStatus("all");
    setTemp("all");
    setIntentFilter("all");
    setActivityFilter("all");
  };

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-6 max-w-[1600px] mx-auto">
        <header>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {filtered.length} of {leads.length} lead records across all products.
            </p>
          </div>
        </header>

        <div className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Filter by lead, company, product, and activity.
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className={cn(
                "inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                hasActiveFilters
                  ? "border-border bg-card text-foreground hover:bg-muted"
                  : "border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
              )}
            >
              Clear filters
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/20">
                  <th className="text-left font-semibold px-5 py-3">
                    <TextFilterHeader
                      label="Lead"
                      value={leadQuery}
                      placeholder="Search lead or role"
                      onChange={setLeadQuery}
                    />
                  </th>
                  <th className="text-left font-semibold px-5 py-3">
                    <TextFilterHeader
                      label="Company"
                      value={companyQuery}
                      placeholder="Search company"
                      onChange={setCompanyQuery}
                    />
                  </th>
                  <th className="text-left font-semibold px-5 py-3">
                    <SelectFilterHeader
                      label="Product"
                      value={projectId}
                      summary={projectId === "all" ? "All" : projects.find((p) => p.id === projectId)?.name ?? "All"}
                      options={[
                        { id: "all", label: "All products" },
                        ...projects.map((project) => ({ id: project.id, label: project.name })),
                      ]}
                      onValueChange={setProjectId}
                    />
                  </th>
                  <th className="text-left font-semibold px-5 py-3">
                    <SelectFilterHeader
                      label="Stage"
                      value={status}
                      summary={status === "all" ? "All" : STATUS_COLUMNS.find((item) => item.id === status)?.label ?? "All"}
                      options={[
                        { id: "all", label: "All stages" },
                        ...STATUS_COLUMNS.map((item) => ({ id: item.id, label: item.label })),
                      ]}
                      onValueChange={(value) => setStatus(value as LeadStatus | "all")}
                    />
                  </th>
                  <th className="text-left font-semibold px-5 py-3">
                    <SelectFilterHeader
                      label="Temp"
                      value={temp}
                      summary={TEMPS.find((item) => item.id === temp)?.label ?? "All"}
                      options={TEMPS}
                      onValueChange={(value) => setTemp(value as Temperature | "all")}
                    />
                  </th>
                  <th className="text-right font-semibold px-5 py-3">
                    <div className="flex justify-end">
                      <SelectFilterHeader
                      label="Interest"
                      value={intentFilter}
                      summary={INTENT_OPTIONS.find((item) => item.id === intentFilter)?.label ?? "All intents"}
                      options={INTENT_OPTIONS}
                        onValueChange={(value) => setIntentFilter(value as IntentFilter)}
                        align="end"
                      />
                    </div>
                  </th>
                  <th className="text-right font-semibold px-5 py-3">
                    <div className="flex justify-end">
                      <SelectFilterHeader
                      label="Last touch"
                      value={activityFilter}
                      summary={ACTIVITY_OPTIONS.find((item) => item.id === activityFilter)?.label ?? "Any time"}
                      options={ACTIVITY_OPTIONS}
                        onValueChange={(value) => setActivityFilter(value as ActivityFilter)}
                        align="end"
                      />
                    </div>
                  </th>
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
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      No lead records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SelectFilterHeader({
  label,
  value,
  summary,
  options,
  onValueChange,
  align = "start",
}: {
  label: string;
  value: string;
  summary: string;
  options: Array<{ id: string; label: string }>;
  onValueChange: (value: string) => void;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 transition-colors hover:border-border hover:bg-card hover:text-foreground",
            value !== "all" && "bg-card border-border text-foreground shadow-soft"
          )}
        >
          <span>{label}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56 rounded-2xl border-border p-2">
        <div className="px-2 py-1.5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">{label}</div>
          <div className="mt-1 text-xs text-foreground font-medium">{summary}</div>
        </div>
        <div className="h-px bg-border my-1" />
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.id} value={option.id}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TextFilterHeader({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1.5 transition-colors hover:border-border hover:bg-card hover:text-foreground",
            value && "bg-card border-border text-foreground shadow-soft"
          )}
        >
          <span>{label}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 rounded-2xl border-border p-3">
        <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">{label}</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-3 h-10 w-full rounded-xl border border-border bg-muted/60 px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
