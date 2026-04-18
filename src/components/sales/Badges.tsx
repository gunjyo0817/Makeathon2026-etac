import { cn } from "@/lib/utils";
import type { Temperature, LeadStatus, MeetingType } from "@/data/mock";

export function TemperatureBadge({ temp, className }: { temp: Temperature; className?: string }) {
  const map = {
    hot: { dot: "bg-temp-hot", label: "Hot", text: "text-temp-hot", bg: "bg-temp-hot/10" },
    warm: { dot: "bg-temp-warm", label: "Warm", text: "text-temp-warm", bg: "bg-temp-warm/10" },
    cold: { dot: "bg-temp-cold", label: "Cold", text: "text-temp-cold", bg: "bg-temp-cold/10" },
  }[temp];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", map.bg, map.text, className)}>
      <span className={cn("size-1.5 rounded-full", map.dot)} />
      {map.label}
    </span>
  );
}

const statusStyles: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  new: { label: "New Lead", bg: "bg-muted", text: "text-muted-foreground" },
  contacted: { label: "Contacted", bg: "bg-info-soft", text: "text-info" },
  responded: { label: "Responded", bg: "bg-primary-soft", text: "text-primary" },
  qualified: { label: "Qualified", bg: "bg-warning-soft", text: "text-warning" },
  meeting: { label: "Meeting Scheduled", bg: "bg-success-soft", text: "text-success" },
  closed: { label: "Closed", bg: "bg-foreground/10", text: "text-foreground" },
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", s.bg, s.text, className)}>
      {s.label}
    </span>
  );
}

const meetingStyles: Record<MeetingType, { label: string; bg: string; text: string }> = {
  demo: { label: "Demo", bg: "bg-primary-soft", text: "text-primary" },
  "follow-up": { label: "Follow-up", bg: "bg-info-soft", text: "text-info" },
  intro: { label: "Intro Call", bg: "bg-success-soft", text: "text-success" },
};

export function MeetingTypeBadge({ type, className }: { type: MeetingType; className?: string }) {
  const m = meetingStyles[type];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", m.bg, m.text, className)}>
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const map = {
    high: { bg: "bg-destructive-soft", text: "text-destructive-ink", label: "High" },
    medium: { bg: "bg-warning-soft", text: "text-warning", label: "Medium" },
    low: { bg: "bg-muted", text: "text-muted-foreground", label: "Low" },
  }[priority];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", map.bg, map.text)}>
      {map.label}
    </span>
  );
}
