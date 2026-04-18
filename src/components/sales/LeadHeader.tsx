import { type Lead, getProjectById } from "@/data/mock";
import { StatusBadge, TemperatureBadge } from "@/components/sales/Badges";
import { ArrowLeft, Mail, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LeadHeader({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const project = getProjectById(lead.projectId);
  return (
    <div className="bg-card border border-border rounded-3xl shadow-card p-6">
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </button>
      <div className="flex items-start gap-5">
        <div className="size-16 rounded-2xl bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-xl shadow-clay shrink-0">
          {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
            <StatusBadge status={lead.status} />
            <TemperatureBadge temp={lead.temperature} />
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" />{lead.company} · {lead.role}</span>
            <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{lead.email}</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold bg-muted text-muted-foreground rounded-full px-2.5 py-1">
            <span className="size-1.5 rounded-full bg-primary" />
            Product: {project?.name}
          </div>
        </div>
      </div>
    </div>
  );
}
