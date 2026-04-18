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
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
};

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
  const data = await request<TwinTableResponse<LeadRow>>("/api/leads");
  return data.rows ?? [];
}
