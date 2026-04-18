/** Map between Meetings grid (dateKey + "HH:mm" half-hour) and Twin `etac_meeting_slots` / `etac_meetings`. */

export function dateKeyLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Same grid labels as Meetings `toHalfHourSlot` (local). */
export function halfHourSlotLabel(date: Date): string {
  const h = date.getHours().toString().padStart(2, "0");
  const roundedMin = date.getMinutes() < 30 ? "00" : "30";
  return `${h}:${roundedMin}`;
}

function rowProductId(row: Record<string, unknown>): string {
  const v = row.product_id ?? row.productId;
  return v != null && String(v).trim() !== "" ? String(v).trim() : "";
}

/** Build availability map for one product from Twin slot rows (30-min cells). */
export function availabilityFromTwinSlotRows(
  rows: Record<string, unknown>[],
  productId: string
): Record<string, string[]> {
  const byDate: Record<string, Set<string>> = {};
  const hasProductColumn = rows.some((r) => rowProductId(r) !== "");

  for (const row of rows) {
    const pid = rowProductId(row);
    if (hasProductColumn && pid !== productId) continue;

    const startStr = String(row.starts_at ?? row.startsAt ?? "");
    if (!startStr) continue;
    const endRaw = row.ends_at ?? row.endsAt;
    const start = new Date(startStr);
    const end = endRaw ? new Date(String(endRaw)) : new Date(start.getTime() + 30 * 60 * 1000);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

    for (let t = start.getTime(); t < end.getTime(); t += 30 * 60 * 1000) {
      const cell = new Date(t);
      const key = dateKeyLocal(cell);
      const slot = halfHourSlotLabel(cell);
      if (!byDate[key]) byDate[key] = new Set();
      byDate[key].add(slot);
    }
  }

  const result: Record<string, string[]> = {};
  for (const [k, set] of Object.entries(byDate)) {
    result[k] = Array.from(set).sort();
  }
  return result;
}

export type TwinSlotInsert = { starts_at: string; ends_at: string; product_id: string };

export function buildTwinSlotInsertsFromAvailability(
  productId: string,
  avail: Record<string, string[]>
): TwinSlotInsert[] {
  const out: TwinSlotInsert[] = [];
  for (const [dKey, slots] of Object.entries(avail)) {
    for (const slot of slots) {
      const [y, mo, d] = dKey.split("-").map(Number);
      const [hh, mm] = slot.split(":").map(Number);
      if (!y || mo < 1 || mo > 12) continue;
      const start = new Date(y, mo - 1, d, hh, mm, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      out.push({
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        product_id: productId,
      });
    }
  }
  return out;
}

/** Rows to remove before re-inserting this product's availability. */
export function twinSlotRowsToDeleteForProduct(
  rows: Record<string, unknown>[],
  productId: string
): Record<string, unknown>[] {
  const hasProductColumn = rows.some((r) => rowProductId(r) !== "");
  if (!hasProductColumn) return [...rows];
  return rows.filter((r) => rowProductId(r) === productId);
}

export type TwinMeetingRecordInput = {
  id: string;
  leadId: string;
  customerName: string;
  company: string;
  type: "demo" | "follow-up" | "intro";
  start: string;
  durationMin: number;
  leadName: string;
  productId: string;
  status: "scheduled" | "rescheduled" | "cancelled";
};

export function mapTwinMeetingsToRecords(
  rows: Record<string, unknown>[],
  leads: { id: string | number; full_name: string; company?: string | null }[],
  defaultProductId: string
): TwinMeetingRecordInput[] {
  const leadById = new Map(leads.map((l) => [String(l.id), l]));

  return rows.map((row) => {
    const rawId = row.id ?? row.Id;
    const lid = String(row.lead_id ?? row.leadId ?? "");
    const lead = leadById.get(lid);
    const pid = rowProductId(row) || defaultProductId;
    const start = String(row.starts_at ?? row.startsAt ?? "");
    const durRaw = row.duration ?? row.durationMin ?? 30;
    const durationMin =
      typeof durRaw === "number" && Number.isFinite(durRaw)
        ? durRaw
        : Number.parseInt(String(durRaw ?? "30"), 10) || 30;

    return {
      id: `twin-${rawId}`,
      leadId: lid,
      customerName: lead?.full_name ?? `Lead ${lid}`,
      company: lead?.company ?? "",
      type: "demo",
      start,
      durationMin,
      leadName: lead?.full_name ?? `Lead ${lid}`,
      productId: pid,
      status: "scheduled",
    };
  });
}
