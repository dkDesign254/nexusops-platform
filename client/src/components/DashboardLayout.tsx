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
  BarChart3,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  Plus,
  Settings,
  Shield,
  Sun,
  Terminal,
  TrendingUp,
  Webhook,
  Zap,
  ChevronRight,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const NAV_GROUPS = [
  {
    label: "Governance",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/" },
      { icon: Plus, label: "New Workflow", path: "/workflows/new" },
      { icon: Activity, label: "Execution Logs", path: "/logs" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: TrendingUp, label: "Performance Data", path: "/performance" },
      { icon: FileText, label: "Reports", path: "/reports" },
      { icon: BarChart3, label: "AI Logs", path: "/ai-logs" },
    ],
  },
  {
    label: "Platform",
    items: [
      { icon: Webhook, label: "Webhook Simulator", path: "/webhooks" },
      { icon: Terminal, label: "System Logs", path: "/system-logs" },
      { icon: CreditCard, label: "Plan & Billing", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "agentops-sidebar-width";
const DEFAULT_WIDTH = 248;
const MIN_WIDTH = 200;
const MAX_WIDTH = 340;

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
    <header className="topbar flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={toggleSidebar}
          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
            <span className="text-muted-foreground/50">AgentOps</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 min-w-0">
                <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground/40" />
                {crumb.path ? (
                  <button onClick={() => setLocation(crumb.path!)} className="hover:text-foreground transition-colors truncate">
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
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-muted/30 cursor-default select-none">
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
              <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p className="font-medium">Airtable connection</p>
            <p className="text-muted-foreground mt-0.5">Last synced {formatLastSync(lastSync)}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-muted-foreground" /> : <Moon className="h-3.5 w-3.5 text-muted-foreground" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-accent/60 transition-colors focus:outline-none">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                  {user?.name?.charAt(0).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                {user?.name ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{user?.name ?? "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-[10px] px-1.5 py-0">
                  {user?.role === "admin" ? "Admin" : "Analyst"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/settings")} className="cursor-pointer text-xs">
              <CreditCard className="mr-2 h-3.5 w-3.5" />
              Plan & Billing
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-xs opacity-50" onClick={() => {}}>
              <Settings className="mr-2 h-3.5 w-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-xs text-destructive focus:text-destructive">
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
  const { data: stats } = trpc.airtable.dashboardStats.useQuery(undefined, { refetchInterval: 60000 });

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="h-12 border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2.5 h-full">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight truncate">AgentOps</p>
              <p className="text-[10px] text-muted-foreground truncate">Governance Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-2 pb-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-1">
            {!isCollapsed && <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{group.label}</p>}
            <SidebarMenu className="px-2">
              {group.items.map((item) => {
                const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={item.label} className="h-8 transition-all font-normal text-[13px] rounded-md">
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}

        {!isCollapsed && (
          <div className="mx-3 mt-3 p-3 rounded-lg bg-accent/40 border border-border/60">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2.5">Runtime Status</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-violet-400" /><span className="text-xs text-foreground">Make</span></div>
                <span className="text-xs font-semibold text-foreground">{stats?.make ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-orange-400" /><span className="text-xs text-foreground">n8n</span></div>
                <span className="text-xs font-semibold text-foreground">{stats?.n8n ?? "—"}</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Plan & Billing" onClick={() => setLocation("/settings")} className="h-8 text-[13px]">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Pro Plan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
  const { loading, user } = useAuth();

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
    } catch {}
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <AuthPanel />;

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <LayoutContent setSidebarWidth={setSidebarWidth} breadcrumbs={breadcrumbs}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  );
}

function LayoutContent({ children, setSidebarWidth, breadcrumbs }: { children: React.ReactNode; setSidebarWidth: (w: number) => void; breadcrumbs?: { label: string; path?: string }[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [location] = useLocation();

  const autoBreadcrumbs = breadcrumbs ?? (() => {
    const map: Record<string, string> = {
      "/": "Dashboard",
      "/workflows/new": "New Workflow",
      "/reports": "Reports",
      "/performance": "Performance Data",
      "/webhooks": "Webhook Simulator",
      "/system-logs": "System Logs",
      "/settings": "Plan & Billing",
      "/logs": "Execution Logs",
      "/ai-logs": "AI Logs",
    };
    const label = map[location];
    if (!label) {
      if (location.startsWith("/workflows/")) return [{ label: "Workflows", path: "/" }, { label: "Detail" }];
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
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
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
          <div className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors" style={{ zIndex: 50 }} onMouseDown={() => setIsResizing(true)} />
        )}
      </div>

      <SidebarInset className="flex flex-col min-h-screen">
        {isMobile && (
          <div className="flex border-b border-border h-12 items-center justify-between bg-background/95 px-3 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-7 w-7 rounded-md" />
              <span className="text-sm font-medium">AgentOps</span>
            </div>
          </div>
        )}
        {!isMobile && <Topbar breadcrumbs={autoBreadcrumbs} />}
        <main className="flex-1 p-6 animate-in-fade">{children}</main>
      </SidebarInset>
    </>
  );
}
