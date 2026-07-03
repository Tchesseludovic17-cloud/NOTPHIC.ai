import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Bell, Settings, LogOut, Gift, BookOpen, Globe, ShieldCheck, Menu, X } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/clients", icon: Users },
    { name: "Alertes", href: "/alertes", icon: Bell },
    { name: "Affiliations", href: "/affiliations", icon: Gift },
    { name: "Mémoire", href: "/company-twin", icon: BookOpen },
  ];

  const siteSlug = user?.slug;

  const navLinkClass = (href: string) => {
    const isActive = location === href || location.startsWith(`${href}/`);
    return `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
      isActive
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    }`;
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} onClick={onNavigate}>
              <div className={navLinkClass(item.href)}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-border space-y-1">
        {siteSlug && (
          <a href={`/site/${siteSlug}`} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
            <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
              <Globe className="w-4 h-4 shrink-0" />
              Mon site public
            </div>
          </a>
        )}
        {user?.est_admin && (
          <Link href="/admin" onClick={onNavigate}>
            <div className={navLinkClass("/admin")}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Admin
            </div>
          </Link>
        )}
        <Link href="/parametres" onClick={onNavigate}>
          <div className={navLinkClass("/parametres")}>
            <Settings className="w-4 h-4 shrink-0" />
            Paramètres
          </div>
        </Link>
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion
        </button>
        {user && (
          <div className="mt-3 px-3 py-2 border-t border-border/40 pt-3">
            <p className="text-xs font-medium text-sidebar-foreground">{user.nom_activite}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* ── Sidebar desktop ── */}
      <div className="w-64 border-r border-border bg-sidebar flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="text-xl font-serif font-semibold text-sidebar-primary tracking-tight">Norphic</span>
        </div>
        <SidebarContent />
      </div>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-sidebar flex flex-col transition-transform duration-300 md:hidden ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <span className="text-xl font-serif font-semibold text-sidebar-primary tracking-tight">Norphic</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header bar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-background md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-lg font-serif font-semibold text-primary tracking-tight">Norphic</span>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
