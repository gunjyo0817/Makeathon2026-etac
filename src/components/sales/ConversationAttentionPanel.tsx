import type { AttentionReason, ConversationAttentionItem } from "@/data/mock";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function ConversationAttentionPanel({ items }: { items: ConversationAttentionItem[] }) {
  const navigate = useNavigate();

  return (
    <section className="bg-card border border-border rounded-3xl p-5 shadow-card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Conversations needing attention</h2>
          <p className="text-sm text-muted-foreground mt-1">Threads that require manual action or intervention.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-soft text-warning">
          <AlertTriangle className="size-3.5" />
          {items.length} open
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground bg-muted rounded-2xl p-4">No conversations need attention right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/leads/${item.leadId}`)}
              className="w-full text-left border border-border rounded-2xl p-4 bg-background/80 hover:border-primary/40 hover:shadow-soft transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold leading-tight">{item.customerName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.company}</div>
                </div>
                <ReasonBadge reason={item.reason} />
              </div>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.summary}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ReasonBadge({ reason }: { reason: AttentionReason }) {
  const meta = {
    no_response: { label: "No response", className: "bg-muted text-muted-foreground" },
    objection_detected: { label: "Objection detected", className: "bg-destructive/10 text-destructive" },
    needs_manual_review: { label: "Needs manual review", className: "bg-warning-soft text-warning" },
    scheduling_mismatch: { label: "Scheduling mismatch", className: "bg-info-soft text-info" },
  }[reason];

  return <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold", meta.className)}>{meta.label}</span>;
}
