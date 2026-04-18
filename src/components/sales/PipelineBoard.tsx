import { useNavigate } from "react-router-dom";
import { type Lead, STATUS_COLUMNS } from "@/data/mock";
import { TemperatureBadge } from "./Badges";
import { timeAgo } from "@/lib/format";
import { ArrowUpRight, Building2 } from "lucide-react";

export function PipelineBoard({ leads, browseHref }: { leads: Lead[]; browseHref?: string }) {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-bold leading-none">Lead Pipeline</div>
          <div className="text-[11px] text-muted-foreground mt-1">{leads.length} active leads · drag to update stage</div>
        </div>
        {browseHref && (
          <button
            type="button"
            onClick={() => navigate(browseHref)}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
          >
            Open leads
            <ArrowUpRight className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-thin">
        {STATUS_COLUMNS.map((col) => {
          const items = leads.filter((l) => l.status === col.id);
          return (
            <div key={col.id} className="w-72 shrink-0 flex flex-col gap-3">
              <div className="flex items-center justify-between px-2">
                <div className="text-xs font-semibold tracking-tight">{col.label}</div>
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums bg-muted px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="bg-muted/60 rounded-2xl p-2.5 flex flex-col gap-2.5 min-h-[120px] flex-1">
                {items.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="text-left bg-card border border-border rounded-xl p-3.5 shadow-soft hover:shadow-card hover:-translate-y-0.5 hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors truncate">
                        {lead.name}
                      </div>
                      <TemperatureBadge temp={lead.temperature} />
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3 truncate">
                      <Building2 className="size-3 shrink-0" />
                      {lead.company}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{timeAgo(lead.lastInteractionAt)}</span>
                      <span className="font-semibold tabular-nums text-foreground/70">{lead.intentScore}<span className="text-muted-foreground font-normal">/100</span></span>
                    </div>
                  </button>
                ))}
                {items.length === 0 && (
                  <div className="text-[11px] text-muted-foreground text-center py-4">No leads</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
