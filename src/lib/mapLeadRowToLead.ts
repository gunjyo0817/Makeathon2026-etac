import type { Lead, LeadStatus, Temperature } from "@/data/mock";
import type { LeadRow } from "@/lib/api";
import { interestLevelFromIntentScore, resolveIntentScoreForLead } from "@/lib/transcriptIntentScore";

export const UNASSIGNED_PRODUCT_ID = "unassigned";

export function normalizeLeadStatus(status?: string): LeadStatus {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (
    normalized === "new" ||
    normalized === "contacted" ||
    normalized === "responded" ||
    normalized === "qualified" ||
    normalized === "meeting" ||
    normalized === "closed"
  ) {
    return normalized;
  }
  if (normalized === "negotiating") {
    return "qualified";
  }
  return "new";
}

export function temperatureFromLeadStatus(status: LeadStatus): Temperature {
  if (status === "qualified" || status === "meeting") return "hot";
  if (status === "contacted" || status === "responded") return "warm";
  return "cold";
}

export function intentFromLeadStatus(status: LeadStatus): number {
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
  const status = normalizeLeadStatus(row.status);
  const pid = linkedProductId(row);
  const intentScore = resolveIntentScoreForLead(row, []);
  return {
    id: String(row.id),
    productId: pid ?? UNASSIGNED_PRODUCT_ID,
    name: row.full_name ?? "Unknown Lead",
    role: "Prospect",
    company: row.company ?? "-",
    email: row.email ?? row.phone ?? "",
    status,
    temperature: temperatureFromLeadStatus(status),
    lastInteractionAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    intentScore,
    budget: "—",
    urgency: "Medium",
    interestLevel: interestLevelFromIntentScore(intentScore),
    agentPaused: false,
    currentChannel: "email",
    availableChannels: ["email", "sms", "phone"],
    messages: [],
    actions: [],
    meetings: [],
  };
}
