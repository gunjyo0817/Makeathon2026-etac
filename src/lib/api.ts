const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000";

type TwinTableResponse<T> = {
  tableName: string;
  kind: string;
  rows: T[];
  total: number;
};

export type ProductRow = {
  id: string | number;
  created_at?: string;
  name: string;
  description?: string;
  price: string | number;
  texture?: string;
};

export type LeadRow = {
  id: string | number;
  created_at?: string;
  updated_at?: string;
  product_id?: string | number | null;
  productId?: string | number | null;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
};

function pick<T>(raw: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (v !== undefined && v !== null && v !== "") return v as T;
  }
  return undefined;
}

/** Twin / DB rows may use snake_case, camelCase, or PascalCase keys. */
export function normalizeLeadRow(raw: Record<string, unknown>): LeadRow | null {
  const id = pick<string | number>(raw, ["id", "Id", "ID"]);
  if (id === undefined) return null;

  const productRef = pick<string | number>(raw, ["product_id", "productId", "ProductId", "etac_product_id"]);
  const fullName =
    pick<string>(raw, ["full_name", "fullName", "FullName", "name"]) ?? "Unknown Lead";

  return {
    id,
    created_at: pick(raw, ["created_at", "createdAt", "CreatedAt"]),
    updated_at: pick(raw, ["updated_at", "updatedAt", "UpdatedAt"]),
    product_id: productRef ?? null,
    full_name: fullName,
    email: pick(raw, ["email", "Email"]),
    phone: pick(raw, ["phone", "Phone"]),
    company: pick(raw, ["company", "Company"]),
    status: pick(raw, ["status", "Status"]),
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<ProductRow[]> {
  const data = await request<TwinTableResponse<ProductRow>>("/api/products");
  return data.rows ?? [];
}

export async function createProduct(payload: {
  name: string;
  description?: string;
  price: number;
  texture?: string;
}): Promise<unknown> {
  return request("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLeads(): Promise<LeadRow[]> {
  const data = await request<TwinTableResponse<Record<string, unknown>>>("/api/leads");
  const rows = data.rows ?? [];
  return rows.map((r) => normalizeLeadRow(r)).filter((r): r is LeadRow => r != null);
}

export type TranscriptApiRow = {
  id?: string | number;
  created_at?: string;
  createdAt?: string;
  customer_id?: string | number;
  customerId?: string | number;
  medium?: string;
  transcript?: string;
};

export type LatestConversationAssignment = {
  leadId: string;
  found: boolean;
  assignedProductId: string | number | null;
  followUpDate: string | null;
  row: Record<string, unknown> | null;
};

export async function getTranscriptsForCustomer(customerId: string): Promise<TranscriptApiRow[]> {
  const q = encodeURIComponent(customerId.trim());
  const data = await request<TwinTableResponse<TranscriptApiRow>>(
    `/api/transcripts?customer_id=${q}`
  );
  return data.rows ?? [];
}

export async function getLatestConversationAssignmentForLead(
  leadId: string
): Promise<LatestConversationAssignment> {
  const q = encodeURIComponent(leadId.trim());
  return request<LatestConversationAssignment>(
    `/api/conversations/latest-assignment?lead_id=${q}`
  );
}

export type TwinSlotOption = {
  id: string | number;
  starts_at: string;
  ends_at?: string | null;
};

export type BookingSessionResponse = {
  lead_id: string;
  display_name: string;
  email?: string | null;
  company?: string | null;
  available_slots: string[];
  /** From Twin `etac_meeting_slots`: shared sales slots, same list for every booking link (hackathon: one rep). */
  twin_slots?: TwinSlotOption[];
  selected_slot?: string | null;
  booking_confirmed: boolean;
};

export async function getBookingSession(token: string): Promise<BookingSessionResponse> {
  const t = encodeURIComponent(token.trim());
  return request<BookingSessionResponse>(`/api/booking/sessions/${t}`);
}

export type ConfirmBookingPayload = {
  slot_start?: string;
  slot_id?: string | number;
  product_id?: string | number;
  meeting_name?: string;
};

export async function confirmBooking(token: string, payload: ConfirmBookingPayload): Promise<unknown> {
  const t = encodeURIComponent(token.trim());
  return request(`/api/booking/sessions/${t}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      slot_start: payload.slot_start ?? "",
      slot_id: payload.slot_id ?? undefined,
      product_id: payload.product_id ?? undefined,
      meeting_name: payload.meeting_name ?? undefined,
    }),
  });
}

/** In-memory `available_slots` only (no Twin row). */
export async function confirmBookingSlot(token: string, slotStart: string): Promise<unknown> {
  return confirmBooking(token, { slot_start: slotStart });
}

// --- Twin tables (etac_meetings, etac_meeting_slots, …) ---

export async function getTwinTableRows(tableName: string): Promise<Record<string, unknown>[]> {
  const name = encodeURIComponent(tableName.trim());
  const data = await request<TwinTableResponse<Record<string, unknown>>>(`/api/tables/${name}`);
  return data.rows ?? [];
}

export async function insertTwinTableRow(
  tableName: string,
  values: Record<string, unknown>
): Promise<unknown> {
  const name = encodeURIComponent(tableName.trim());
  return request(`/api/tables/${name}/rows`, {
    method: "POST",
    body: JSON.stringify({ values }),
  });
}

export async function patchTwinTableRow(
  tableName: string,
  primaryKey: Record<string, unknown>,
  updates: Record<string, unknown>
): Promise<unknown> {
  const name = encodeURIComponent(tableName.trim());
  return request(`/api/tables/${name}/rows`, {
    method: "PATCH",
    body: JSON.stringify({ primaryKey, updates }),
  });
}

export async function deleteTwinTableRows(
  tableName: string,
  rowKeys: Record<string, unknown>[]
): Promise<unknown> {
  const name = encodeURIComponent(tableName.trim());
  return request(`/api/tables/${name}/rows`, {
    method: "DELETE",
    body: JSON.stringify({ rowKeys }),
export async function triggerFollowUpPhoneCall(customerId: string): Promise<{
  ok: boolean;
  customerId: string;
  result: unknown;
}> {
  return request("/api/follow-up/call", {
    method: "POST",
    body: JSON.stringify({ customer_id: customerId.trim() }),
  });
}
