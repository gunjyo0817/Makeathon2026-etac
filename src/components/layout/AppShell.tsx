import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Users, Calendar, BarChart3, Settings, Search, Bell, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: FolderKanban },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/meetings", label: "In-person trials", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh bg-background text-foreground">
      <Sidebar />
      <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin">{children}</main>
        <div
          aria-hidden="true"
          className="group absolute bottom-6 right-8 aspect-square w-40 max-w-[22vw] overflow-hidden"
        >
          <img
            src="/IMG_0615.PNG"
            alt=""
            className="size-full scale-125 object-cover opacity-90 transition-opacity duration-200 group-hover:opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const location = useLocation();
  return (
    <aside className="w-64 shrink-0 m-3 mr-0 bg-sidebar rounded-3xl border border-sidebar-border shadow-card flex flex-col">
      <NavLink to="/" className="mx-3 mt-3 rounded-2xl p-3 flex items-center gap-3 transition-colors hover:bg-muted/70">
        <img src="/IMG_0615.PNG" alt="Etac logo" className="size-14 shrink-0 scale-125 object-cover" />
        <div>
          <div className="font-bold tracking-tight text-lg leading-none">Etac</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Product Sales</div>
        </div>
      </NavLink>

      <nav className="flex-1 px-3 flex flex-col gap-1">
        <div className="px-4 py-2 text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mt-2">Workspace</div>
        {nav.map((item) => {
          const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "px-4 py-2.5 rounded-2xl text-sm font-display font-medium flex items-center gap-3 transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="p-3 bg-muted rounded-2xl border border-border flex items-center gap-3">
          <div className="size-9 rounded-full bg-gradient-clay text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">ET</div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate leading-tight">Elias Thorne</div>
            <div className="text-xs text-muted-foreground truncate">Director of Sales</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const [q, setQ] = useState("");
  return (
    <header className="h-16 px-8 flex items-center justify-between gap-4 shrink-0">
      <div className="relative flex-1 max-w-md">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search leads, companies, products…"
          className="w-full h-10 pl-9 pr-4 rounded-full bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="size-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
