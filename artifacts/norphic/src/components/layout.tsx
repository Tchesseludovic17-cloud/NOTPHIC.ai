import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Bell, Settings, LogOut } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  const navigation = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Alertes", href: "/alertes", icon: Bell },
  ];

  return (
    <div className="min-h-screen flex w-full bg-background">
      <div className="w-64 border-r border-border bg-sidebar flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-xl font-serif font-semibold text-sidebar-primary tracking-tight">Norphic</span>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(`${item.href}/`);
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-border space-y-1">
          <Link href="/parametres">
            <div className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              location === "/parametres" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            }`}>
              <Settings className="w-4 h-4" />
              Paramètres
            </div>
          </Link>
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors mt-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </div>
          {user && (
            <div className="mt-4 px-3 py-2">
              <p className="text-xs font-medium text-sidebar-foreground">{user.nom_activite}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}