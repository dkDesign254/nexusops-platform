import { useAuth } from "@/_core/hooks/useAuth";
import AuthPanel from "@/components/AuthPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Bot,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  TrendingUp,
  Webhook,
  Zap,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const NAV_GROUPS = [
  {
    label: "Start",
    items: [
      { icon: Home, label: "Homepage", path: "/home" },
      { icon: LayoutDashboard, label: "Workspace", path: "/" },
    ],
  },
  {
    label: "Build",
    items: [
      { icon: Plus, label: "New Workflow", path: "/workflows/new" },
      { icon: Activity, label: "Workflow Runs", path: "/logs" },
      { icon: Bot, label: "AI Activity", path: "/ai-logs" },
    ],
  },
  {
    label: "Understand",
    items: [
      { icon: FileText, label: "Reports", path: "/reports" },
      { icon: TrendingUp, label: "Performance", path: "/performance" },
      { icon: Sparkles, label: "GAIA AI", path: "/help" }
    ],
  },
  {
    label: "Manage",
    items: [
      { icon: Webhook, label: "Integrations", path: "/webhooks" },
      { icon: Terminal, label: "System Health", path: "/system-logs" },
      { icon: CreditCard, label: "Billing & Workspace", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "agentops-sidebar-width";
const SIDEBAR_OPEN_KEY = "agentops-sidebar-open";
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

function useSystemStatus() {
  const [status, setStatus] = useState<"live" | "syncing" | "error">("live");
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus("syncing");
      setTimeout(() => {
        setStatus("live");
        setLastSync(new Date());
      }, 1200);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  return { status, lastSync };
}

function Topbar({ breadcrumbs }: { breadcrumbs?: { label: string; path?: string }[] }) {
  const { theme, toggleTheme } = useTheme();
  const { status, lastSync } = useSystemStatus();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toggleSidebar } = useSidebar();

  const statusConfig = {
    live: { label: "Live", color: "text-emerald-400", dot: "bg-emerald-400" },
    syncing: { label: "Syncing…", color: "text-blue-400", dot: "bg-blue-400" },
    error: { label: "Error", color: "text-red-400", dot: "bg-red-400" },
  }[status];

  const formatLastSync = (d: Date) => {
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggleSidebar}
          className="h-8 w-8 flex items-center justify-center rounded-xl border border-border/60 bg-background/70 hover:bg-accent transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
            <button
              onClick={() => setLocation("/home")}
              className="text-muted-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              AgentOps
            </button>

            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/40" />
                {crumb.path ? (
                  <button
                    onClick={() => setLocation(crumb.path!)}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-foreground font-medium truncate">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 cursor-default select-none shadow-sm">
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p className="font-medium">Workspace sync status</p>
            <p className="text-muted-foreground mt-0.5">Last synced {formatLastSync(lastSync)}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl border border-border/60 bg-background/70"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-2.5 py-1.5 hover:bg-accent/60 transition-colors focus:outline-none shadow-sm">
              <Avatar className="h-7 w-7 border border-border/70">
                <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>

              <span className="text-xs font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                {user?.name ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-[10px] px-1.5 py-0 rounded-full">
                  {user?.role === "admin" ? "Admin" : user?.role === "analyst" ? "Analyst" : "Viewer"}
                </Badge>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setLocation("/home")} className="cursor-pointer text-xs">
              <Home className="mr-2 h-3.5 w-3.5" />
              Homepage
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setLocation("/help")} className="cursor-pointer text-xs">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              GAIA AI
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer text-xs">
              <Settings className="mr-2 h-3.5 w-3.5" />
              Workspace Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer text-xs">
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Plan & Billing
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setLocation("/system-logs")} className="cursor-pointer text-xs">
              <Terminal className="mr-2 h-3.5 w-3.5" />
              System Health
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer text-xs text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { data: stats } = trpc.airtable.dashboardStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl">
      <SidebarHeader className="border-b border-sidebar-border/70 px-3 py-3">
        <button
          onClick={() => setLocation("/home")}
          className="flex items-center gap-2.5 h-full text-left w-full"
        >
          <div className="w-8 h-8 rounded-2xl bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-4 h-4 text-primary" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate">AgentOps</p>
              <p className="text-[10px] text-muted-foreground truncate">Enterprise agent governance</p>
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-3 pb-3">
        {!isCollapsed && (
          <div className="mx-3 mb-4 rounded-2xl border border-border/70 bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Operations Command</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  Monitor autonomous agents, intervene on exceptions, and keep every workflow audit-ready.
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            </div>
          </div>
        )}

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            {!isCollapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/60">
                {group.label}
              </p>
            )}

            <SidebarMenu className="px-2">
              {group.items.map((item) => {
                const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                const isPrimaryAction = item.label === "New Workflow";

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      className={`h-9 rounded-xl px-3 transition-all ${
                        isPrimaryAction
                          ? "bg-primary text-white hover:opacity-90"
                          : isActive
                          ? "bg-primary/12 border border-primary/25 shadow-sm"
                          : "hover:bg-accent/70"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? isPrimaryAction
                              ? "text-white"
                              : "text-primary"
                            : isPrimaryAction
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={
                          isPrimaryAction
                            ? "text-white font-semibold"
                            : isActive
                            ? "text-primary font-semibold"
                            : "text-muted-foreground"
                        }
                      >
                        {item.label}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}

        {!isCollapsed && (
          <div className="mx-3 mt-2 p-4 rounded-2xl bg-background/70 border border-border/70 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 mb-3">
              Runtime Footprint
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => setLocation("/logs?runtime=make")}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 hover:bg-violet-500/10 transition"
                >
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-violet-400" />
                  <span className="text-xs text-foreground">Make</span>
                </div>
                <span className="text-xs font-semibold">{stats?.make ?? "—"}</span>
              </button>
              
              <button
                onClick={() => setLocation("/logs?runtime=n8n")}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2 hover:bg-orange-500/10 transition"
                >
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-foreground">n8n</span>
                </div>
                <span className="text-xs font-semibold">{stats?.n8n ?? "—"}</span>
               </button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border/70">
        {!isCollapsed ? (
          <button
            onClick={() => setLocation("/help")}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors shadow-sm ${
              location === "/help"
                ? "border-primary/30 bg-primary/10"
                : "border-border/70 bg-gradient-to-br from-background to-muted/30 hover:border-primary/30 hover:bg-accent/40"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">Ask GAIA AI</p>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                  Use GAIA AI to understand the platform, workflows, and where to go next.
                </p>
              </div>
              <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            </div>
          </button>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="GAIA AI"
                onClick={() => setLocation("/help")}
                className="h-9 rounded-xl"
              >
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">GAIA AI</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; path?: string }[];
}

export default function DashboardLayout({ children, breadcrumbs }: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
      return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
    } catch {
      return DEFAULT_WIDTH;
    }
  });

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
      return saved === null ? true : saved === "true";
    } catch {
      return true;
    }
  });

  const { loading, user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    } catch {}
  }, [sidebarWidth]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_OPEN_KEY, String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <AuthPanel />;

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <LayoutContent setSidebarWidth={setSidebarWidth} breadcrumbs={breadcrumbs}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}

function LayoutContent({
  children,
  setSidebarWidth,
  breadcrumbs,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
  breadcrumbs?: { label: string; path?: string }[];
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!["/signin", "/home"].includes(location)) {
      sessionStorage.setItem("agentops:last-path", location);
    }
  }, [location]);

  const autoBreadcrumbs =
    breadcrumbs ??
    (() => {
      const map: Record<string, string> = {
        "/home": "Homepage",
        "/": "Workspace",
        "/workflows/new": "New Workflow",
        "/reports": "Reports",
        "/performance": "Performance",
        "/webhooks": "Integrations",
        "/system-logs": "System Health",
        "/settings": "Billing & Workspace",
        "/logs": "Workflow Runs",
        "/ai-logs": "AI Activity",
        "/help": "GAIA AI",
      };

      const label = map[location];
      if (!label) {
        if (location.startsWith("/workflows/")) {
          return [
            { label: "Workspace", path: "/" },
            { label: "Workflow Detail" },
          ];
        }
        return [];
      }

      return [{ label }];
    })();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - left;

      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <AppSidebar />
        {!isCollapsed && !isMobile && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors"
            style={{ zIndex: 50 }}
            onMouseDown={() => setIsResizing(true)}
          />
        )}
      </div>

      <SidebarInset className="flex flex-col min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.06),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.04),transparent_18%)]">
        {isMobile && (
          <div className="flex border-b border-border/60 h-12 items-center justify-between bg-background/90 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-7 w-7 rounded-md" />
              <button onClick={() => setLocation("/home")} className="text-sm font-medium">
                AgentOps
              </button>
            </div>
          </div>
        )}

        {!isMobile && <Topbar breadcrumbs={autoBreadcrumbs} />}

        <main className="flex-1 px-6 py-6 animate-in">{children}</main>

        <button
          onClick={() => setLocation("/help")}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:scale-105 transition"
          >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium">GAIA AI</span>
        </button>
      </SidebarInset>
    </>
  );
}
