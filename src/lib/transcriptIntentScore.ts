/** Latest non-null `interest_level` from `etac_transcript` for a lead (`customer_id` === lead id). */

export const DEFAULT_INTENT_SCORE = 20;

export function clampIntentScore(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_INTENT_SCORE;
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function parseInterestLevelField(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return clampIntentScore(n);
}

function rowCreatedMs(row: Record<string, unknown>): number {
  const t = row.created_at ?? row.createdAt;
  if (t === null || t === undefined || t === "") return 0;
  const ms = new Date(String(t)).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Among transcript rows for this lead with non-null interest_level, use the row with the latest created_at.
 */
export function latestIntentScoreFromTranscriptRows(
  rows: Iterable<Record<string, unknown>>,
  leadId: string
): number {
  const cid = String(leadId).trim();
  let best: { ms: number; val: number } | null = null;
  for (const row of rows) {
    const cust = String(row.customer_id ?? row.customerId ?? "").trim();
    if (cust !== cid) continue;
    const val = parseInterestLevelField(row.interest_level ?? row.interestLevel);
    if (val === null) continue;
    const ms = rowCreatedMs(row);
    if (!best || ms > best.ms) best = { ms, val };
  }
  return best ? best.val : DEFAULT_INTENT_SCORE;
}

export function interestLevelFromIntentScore(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

/** Prefer API `intent_score` when present; else latest non-null from transcript rows (default 20). */
export function resolveIntentScoreForLead(
  row: { id: string | number; intent_score?: number | null },
  transcriptRows: Iterable<Record<string, unknown>>
): number {
  if (row.intent_score != null && Number.isFinite(Number(row.intent_score))) {
    return clampIntentScore(Number(row.intent_score));
  }
  return latestIntentScoreFromTranscriptRows(transcriptRows, String(row.id));
}
