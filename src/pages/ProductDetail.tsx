import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import type { LeadStatus, Temperature } from "@/data/mock";
import { ArrowLeft, Box, FileText, Tag, Users } from "lucide-react";
import { StatusBadge, TemperatureBadge } from "@/components/sales/Badges";
import { getLeads, getProducts, type LeadRow, type ProductRow } from "@/lib/api";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productRows, leadRows] = await Promise.all([getProducts(), getLeads()]);
        setProducts(productRows);
        setLeads(leadRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const product = useMemo(() => {
    if (!id) return undefined;
    return products.find((item) => String(item.id) === id);
  }, [id, products]);

  const productLeads = useMemo(() => {
    if (!id) return [];
    return leads.filter((lead) => String(lead.product_id ?? "") === id);
  }, [id, leads]);

  const normalizeStatus = (status?: string): LeadStatus => {
    if (status === "new" || status === "contacted" || status === "responded" || status === "qualified" || status === "meeting" || status === "closed") {
      return status;
    }
    return "new";
  };

  const tempFromStatus = (status: LeadStatus): Temperature => {
    if (status === "qualified" || status === "meeting") return "hot";
    if (status === "contacted" || status === "responded") return "warm";
    return "cold";
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-card text-sm text-muted-foreground">
            Loading product details...
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-destructive/30 rounded-3xl p-10 text-center shadow-card">
            <h2 className="text-lg font-bold text-destructive">Failed to load product</h2>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!product || !id) {
    return (
      <AppShell>
        <div className="p-10 max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-10 text-center shadow-card">
            <h2 className="text-lg font-bold">Product not found</h2>
            <p className="text-sm text-muted-foreground mt-2">The product you're looking for doesn't exist.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const createdAt = new Date(product.created_at ?? Date.now()).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const scrollToProductLeads = () => {
    const section = document.getElementById("product-leads");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-8 pt-2 sm:gap-7 sm:px-6 sm:pb-10 lg:px-8">
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <button
              onClick={() => navigate("/products")}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 mb-4 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to Products
            </button>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="size-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Box className="size-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-3xl text-pretty">{product.description}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={scrollToProductLeads}
            className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft text-left hover:border-primary/40 hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Leads linked</div>
            <div className="mt-1 text-2xl font-bold">{productLeads.length}</div>
          </button>
        </header>

        <section className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
              <Tag className="size-4" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none">Product Information</div>
              <div className="text-[11px] text-muted-foreground mt-1">Core metadata for this product.</div>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard label="Product ID" value={String(product.id)} />
            <InfoCard label="Created time" value={createdAt} />
            <InfoCard label="Price" value={`$${product.price}`} />
            <InfoCard label="Texture" value={product.texture ?? "-"} />
          </div>
        </section>

        <section className="bg-card border border-border rounded-3xl shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-info-soft text-info flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <div className="text-sm font-bold leading-none">Description</div>
              <div className="text-[11px] text-muted-foreground mt-1">Name, description, and current objective.</div>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 gap-4">
            <InfoCard label="Name" value={product.name} />
            <InfoCard label="Description" value={product.description ?? "-"} />
            <InfoCard label="Objective" value="-" />
          </div>
        </section>

        <section id="product-leads" className="bg-card border border-border rounded-3xl shadow-card overflow-hidden scroll-mt-24">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-warning-soft text-warning flex items-center justify-center">
                <Users className="size-4" />
              </div>
              <div>
                <div className="text-sm font-bold leading-none">Product Leads</div>
                <div className="text-[11px] text-muted-foreground mt-1">Leads currently linked to this product.</div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/leads?productId=${product.id}`)}
              className="rounded-xl border border-border px-3.5 py-2 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Open in Leads
            </button>
          </div>

          {productLeads.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">No leads are linked to this product yet.</div>
          ) : (
            <div className="divide-y divide-border">
              {productLeads.slice(0, 6).map((lead) => {
                const status = normalizeStatus(lead.status);
                const temperature = tempFromStatus(status);
                return (
                <button
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="w-full px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold leading-tight">{lead.full_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {lead.company ?? "-"} · {lead.email ?? lead.phone ?? "-"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TemperatureBadge temp={temperature} />
                      <StatusBadge status={status} />
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/35 p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-semibold mt-2 leading-relaxed text-pretty">{value}</div>
    </div>
  );
}
