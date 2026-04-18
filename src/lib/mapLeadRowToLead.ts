import type { Lead, LeadStatus, Temperature } from "@/data/mock";
import type { LeadRow } from "@/lib/api";

export const UNASSIGNED_PRODUCT_ID = "unassigned";

function normalizeStatus(status?: string): LeadStatus {
  if (status === "new" || status === "contacted" || status === "responded" || status === "qualified" || status === "meeting" || status === "closed") {
    return status;
  }
  return "new";
}

function normalizeTemp(status: LeadStatus): Temperature {
  if (status === "qualified" || status === "meeting") return "hot";
  if (status === "contacted" || status === "responded") return "warm";
  return "cold";
}

function intentFromStatus(status: LeadStatus): number {
  if (status === "qualified" || status === "meeting") return 80;
  if (status === "contacted") return 60;
  return 40;
}

function linkedProductId(row: LeadRow): string | null {
  const v = row.product_id ?? row.productId;
  if (v == null || v === "") return null;
  return String(v);
}

export function mapLeadRowToLead(row: LeadRow): Lead {
  const status = normalizeStatus(row.status);
  const pid = linkedProductId(row);
  return {
    id: String(row.id),
    productId: pid ?? UNASSIGNED_PRODUCT_ID,
    name: row.full_name ?? "Unknown Lead",
    role: "Prospect",
    company: row.company ?? "-",
    email: row.email ?? "",
    status,
    temperature: normalizeTemp(status),
    lastInteractionAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    intentScore: intentFromStatus(status),
    budget: "—",
    urgency: "Medium",
    interestLevel: "Medium",
    agentPaused: false,
    currentChannel: "email",
    availableChannels: ["email", "sms", "phone"],
    messages: [],
    actions: [],
    meetings: [],
  };
}
