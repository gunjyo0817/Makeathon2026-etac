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
