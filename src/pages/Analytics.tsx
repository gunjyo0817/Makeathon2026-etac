import { AppShell } from "@/components/layout/AppShell";
import { leads, metrics, STATUS_COLUMNS } from "@/data/mock";
import { TrendingUp, TrendingDown, Users, MessageSquare, CalendarCheck, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Quoted Value", value: "$1.84M", delta: "+12.4%", up: true, icon: Target },
  { label: "Buyer Replies (7d)", value: "248", delta: "+18.2%", up: true, icon: MessageSquare },
  { label: "Booked Visits", value: metrics.scheduledMeetings, delta: "+3", up: true, icon: CalendarCheck },
  { label: "Avg. Response Time", value: "2.4h", delta: "-22%", up: true, icon: Users },
];

const weeklyActivity = [
  { day: "Mon", sent: 42, replies: 11 },
  { day: "Tue", sent: 58, replies: 16 },
  { day: "Wed", sent: 51, replies: 14 },
  { day: "Thu", sent: 67, replies: 22 },
  { day: "Fri", sent: 49, replies: 19 },
  { day: "Sat", sent: 12, replies: 4 },
  { day: "Sun", sent: 8, replies: 2 },
];

export default function Analytics() {
  const maxSent = Math.max(...weeklyActivity.map((d) => d.sent));
  const total = leads.length;

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1600px] mx-auto">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Performance of Etac assistants across active furniture products. Last 7 days.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpis.map((k) => (
            <div key={k.label} className="bg-card p-5 rounded-3xl border border-border shadow-card flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-muted-foreground">{k.label}</span>
                <div className="size-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <k.icon className="size-4" />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight tabular-nums">{k.value}</div>
              <div className={cn("inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", k.up ? "bg-success-soft text-success" : "bg-destructive-soft text-destructive-ink")}>
                {k.up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.delta}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          <div className="bg-card border border-border rounded-3xl shadow-card p-6">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <div className="text-sm font-bold">Buyer Outreach Activity</div>
                <div className="text-[11px] text-muted-foreground mt-1">Messages sent vs. buyer replies received</div>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary/40" /> Sent</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Replies</span>
              </div>
            </div>

            <div className="flex items-end gap-3 h-56">
              {weeklyActivity.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex items-end gap-1.5 h-48">
                    <div className="flex-1 bg-primary/30 rounded-t-lg transition-all hover:bg-primary/50" style={{ height: `${(d.sent / maxSent) * 100}%` }} title={`${d.sent} sent`} />
                    <div className="flex-1 bg-primary rounded-t-lg transition-all" style={{ height: `${(d.replies / maxSent) * 100}%` }} title={`${d.replies} replies`} />
                  </div>
                  <div className="text-[11px] font-semibold text-muted-foreground">{d.day}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl shadow-card p-6 flex flex-col">
            <div className="mb-5">
              <div className="text-sm font-bold">Buyer Stage Distribution</div>
              <div className="text-[11px] text-muted-foreground mt-1">Where your {total} buyer records are right now</div>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              {STATUS_COLUMNS.map((s, i) => {
                const count = leads.filter((l) => l.status === s.id).length;
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={s.id}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xs font-semibold">{s.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{count} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%`, opacity: 0.4 + (i / STATUS_COLUMNS.length) * 0.6 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-card p-6">
          <div className="text-sm font-bold mb-5">Top Performing Products</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-semibold py-3">Product</th>
                  <th className="text-right font-semibold py-3">Sent</th>
                  <th className="text-right font-semibold py-3">Reply Rate</th>
                  <th className="text-right font-semibold py-3">Visits</th>
                  <th className="text-right font-semibold py-3">Quoted Value</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "Linden Lounge Chair", sent: 412, reply: 28, meetings: 9, value: "$642k" },
                  { name: "Alder Dining Table", sent: 184, reply: 19, meetings: 4, value: "$890k" },
                  { name: "Harbor Modular Sofa", sent: 98, reply: 64, meetings: 6, value: "$312k" },
                ].map((r) => (
                  <tr key={r.name} className="border-b border-border last:border-0 hover:bg-muted/60 transition-colors">
                    <td className="py-3.5 font-semibold">{r.name}</td>
                    <td className="py-3.5 text-right tabular-nums text-muted-foreground">{r.sent}</td>
                    <td className="py-3.5 text-right tabular-nums font-semibold text-success">{r.reply}%</td>
                    <td className="py-3.5 text-right tabular-nums">{r.meetings}</td>
                    <td className="py-3.5 text-right tabular-nums font-bold">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
