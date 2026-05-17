import { Link, useLocation } from "wouter";
import { LayoutDashboard, MapPin, Activity, Hospital, Map, Pencil, TrendingUp } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ReactNode } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Lucknow Map", href: "/map", icon: Map },
  { name: "Road Editor", href: "/road-editor", icon: Pencil },
  { name: "Traffic Analysis", href: "/traffic-analysis", icon: TrendingUp },
  { name: "Intersections", href: "/intersections", icon: MapPin },
  { name: "Dispatch", href: "/ambulances", icon: Activity },
  { name: "Hospitals", href: "/hospitals", icon: Hospital },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full bg-background font-mono text-sm">
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
          <SidebarHeader className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight text-sidebar-foreground uppercase">
                  Traffic Control
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Command Center
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Operations
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                        tooltip={item.name}
                      >
                        <Link href={item.href} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4 shrink-0 bg-background/95 backdrop-blur z-10 sticky top-0">
            <SidebarTrigger />
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-chart-1 animate-pulse" />
              SYSTEM ONLINE
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6 relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
