import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { getProjectById, leads } from "@/data/mock";
import { ArrowLeft, Box, FileText, Tag } from "lucide-react";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const project = id ? getProjectById(id) : undefined;

  const projectLeads = useMemo(() => leads.filter((lead) => lead.projectId === id), [id]);

  if (!project || !id) {
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

  const createdAt = new Date(project.createdAt).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <AppShell>
      <div className="px-8 pb-10 pt-2 flex flex-col gap-7 max-w-[1200px] mx-auto">
        <header className="flex items-start justify-between gap-6 flex-wrap">
          <div className="min-w-0">
            <button
              onClick={() => navigate("/projects")}
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
                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-2 text-sm max-w-3xl text-pretty">{project.description}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Leads linked</div>
            <div className="mt-1 text-2xl font-bold">{projectLeads.length}</div>
          </div>
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
            <InfoCard label="Product ID" value={project.id} />
            <InfoCard label="Created time" value={createdAt} />
            <InfoCard label="Price" value={`$${project.price}`} />
            <InfoCard label="Texture" value={project.texture} />
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
            <InfoCard label="Name" value={project.name} />
            <InfoCard label="Description" value={project.description} />
            <InfoCard label="Objective" value={project.objective} />
          </div>
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
