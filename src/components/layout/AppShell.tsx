import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Search,
  Bell,
  Bot,
  Menu,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "etac-sidebar-collapsed";

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
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  return (
    <div className="flex h-dvh bg-background text-foreground">
      <aside
        className={cn(
          "hidden lg:flex shrink-0 m-3 mr-0 bg-sidebar rounded-3xl border border-sidebar-border shadow-card flex-col transition-[width] duration-200 ease-out overflow-hidden",
          collapsed ? "w-[4.5rem]" : "w-64"
        )}
        aria-label="Main navigation"
      >
        <SidebarNav collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100vw,19rem)] border-sidebar-border bg-sidebar p-0 sm:max-w-[19rem]">
          <SheetHeader className="sr-only">
            <SheetTitle>Main navigation</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col overflow-y-auto">
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onOpenMobileNav={() => setMobileOpen(true)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />
        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</main>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 right-4 hidden aspect-square w-28 max-w-[30vw] overflow-hidden sm:bottom-6 sm:right-6 sm:block sm:w-40 sm:max-w-[22vw]"
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

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  return (
    <>
      <NavLink
        to="/"
        onClick={onNavigate}
        className={cn(
          "mx-3 mt-3 flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted/70",
          collapsed && "mx-2 justify-center p-2"
        )}
      >
        <img
          src="/IMG_0615.PNG"
          alt="Etac logo"
          className={cn("size-14 shrink-0 scale-125 object-cover", collapsed && "size-10 scale-110")}
        />
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-lg font-bold leading-none tracking-tight">Etac</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Product Sales</div>
          </div>
        )}
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {!collapsed && (
          <div className="mt-2 px-4 py-2 font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Workspace
          </div>
        )}
        {nav.map((item) => {
          const active = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-2.5 font-display text-sm font-medium transition-colors",
                collapsed && "justify-center px-2",
                active
                  ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("p-3", collapsed && "px-2")}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-border bg-muted p-3",
            collapsed && "justify-center p-2"
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-clay text-sm font-bold text-primary-foreground">
            ET
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold leading-tight">Elias Thorne</div>
              <div className="truncate text-xs text-muted-foreground">Director of Sales</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Topbar({
  onOpenMobileNav,
  onToggleCollapse,
  collapsed,
}: {
  onOpenMobileNav: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}) {
  const [q, setQ] = useState("");
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden shrink-0 lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeft className="size-5" /> : <PanelLeftClose className="size-5" />}
      </Button>
      <div className="relative min-w-0 flex-1 max-sm:min-w-[120px] sm:max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-4 text-sm placeholder:text-muted-foreground transition-all focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 max-sm:text-[15px]"
        />
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
