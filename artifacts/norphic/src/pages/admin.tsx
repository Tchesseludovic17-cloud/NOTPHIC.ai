import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";

interface AdminUser {
  id: number;
  nom_activite: string;
  categorie_activite: string;
  email: string | null;
  slug: string;
  plan: string;
  est_admin: boolean;
  created_at: string;
  last_active: string | null;
  actif: boolean;
  nb_clients: number;
  nb_alertes: number;
}

interface AdminGlobal {
  total_utilisateurs: number;
  utilisateurs_actifs: number;
  total_alertes: number;
  taux_relance_global: number | null;
  total_relances: number;
  relances_reussies: number;
}

interface Suggestion {
  id: number;
  commentaire: string | null;
  created_at: string;
  nom_activite: string;
}

interface AdminOverview {
  users: AdminUser[];
  global: AdminGlobal;
  suggestions: Suggestion[];
}

const CATEGORIE_LABEL: Record<string, string> = {
  rendez_vous_regulier: "RDV régulier",
  commerce_fidele: "Commerce fidèle",
  service_independant: "Service indép.",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function useAdminOverview() {
  return useQuery<AdminOverview>({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/overview", { credentials: "include" });
      if (!res.ok) throw new Error("Accès refusé");
      return res.json();
    },
    retry: false,
  });
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { retry: false } });
  const { data, isLoading, error } = useAdminOverview();

  useEffect(() => {
    if (!meLoading && me && !(me as { est_admin?: boolean }).est_admin) {
      setLocation("/dashboard");
    }
  }, [me, meLoading, setLocation]);

  if (meLoading || isLoading) {
    return (
      <Layout>
        <div className="text-muted-foreground text-sm">Chargement...</div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="text-red-600 text-sm">Accès refusé ou erreur de chargement.</div>
      </Layout>
    );
  }

  const { users, global: g, suggestions } = data;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Tableau de bord Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de la plateforme Norphic</p>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Utilisateurs", value: g.total_utilisateurs },
            { label: "Actifs (7j)", value: g.utilisateurs_actifs },
            { label: "Alertes totales", value: g.total_alertes },
            {
              label: "Taux relance",
              value: g.taux_relance_global !== null ? `${g.taux_relance_global}%` : "—",
            },
          ].map((s) => (
            <div key={s.label} className="border border-border rounded-xl p-4 bg-card">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Utilisateurs inscrits ({users.length})</h2>
          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activité</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catégorie</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Clients</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Alertes</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inscription</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dernière activité</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {u.nom_activite}
                      {u.est_admin && (
                        <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">admin</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{CATEGORIE_LABEL[u.categorie_activite] ?? u.categorie_activite}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">{u.nb_clients}</td>
                    <td className="px-4 py-3 text-center font-semibold">{u.nb_alertes}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(u.last_active)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.actif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {u.actif ? "actif" : "inactif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Suggestions utilisateurs ({suggestions.length})
          </h2>
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground text-sm border border-border rounded-xl p-4">Aucune suggestion pour le moment.</p>
          ) : (
            <div className="border border-border rounded-xl divide-y divide-border">
              {suggestions.map((s) => (
                <div key={s.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{s.nom_activite}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(s.created_at)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.commentaire ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
