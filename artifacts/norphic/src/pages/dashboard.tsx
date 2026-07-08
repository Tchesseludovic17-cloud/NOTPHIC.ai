import { useGetStats, useListAlertes, getGetStatsQueryKey, getListAlertesQueryKey, useRunDetection, useGetMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, AlertTriangle, ShieldCheck, Activity, BellRing, ArrowRight, Globe, Copy, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: user } = useGetMe();
  const { data: alertes, isLoading: alertesLoading } = useListAlertes(
    { statut: "non_lu" },
    { query: { queryKey: getListAlertesQueryKey({ statut: "non_lu" }) } }
  );
  
  const runDetection = useRunDetection();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const siteUrl = user?.slug ? `${window.location.origin}/site/${user.slug}` : null;

  const copySiteUrl = () => {
    if (!siteUrl) return;
    navigator.clipboard.writeText(siteUrl);
    toast({ title: t("dashboard.linkCopied"), description: t("dashboard.linkCopiedDesc") });
  };

  const handleRunDetection = () => {
    runDetection.mutate(undefined, {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAlertesQueryKey({ statut: "non_lu" }) });
        toast({
          title: t("dashboard.analysisComplete"),
          description: result.message,
        });
      },
      onError: () => {
        toast({
          title: t("error"),
          description: t("dashboard.analysisError"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t("dashboard.overview")}</h1>
          <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button 
            onClick={handleRunDetection} 
            disabled={runDetection.isPending}
            className="gap-2"
          >
            <Activity className="w-4 h-4" />
            {runDetection.isPending ? t("dashboard.analysisRunning") : t("dashboard.runAnalysis")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.totalClients")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.total_clients}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.activeAlerts")}</CardTitle>
            <BellRing className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{statsLoading ? "-" : stats?.alertes_actives}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.clientsAtRisk")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{statsLoading ? "-" : stats?.clients_a_risque}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.safeClients")}</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{statsLoading ? "-" : stats?.clients_ok}</div>
          </CardContent>
        </Card>
      </div>

      {/* Site public card */}
      {user?.slug && (
        <div className="mb-8 p-5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("dashboard.yourPublicSite")}</p>
              <p className="font-semibold text-foreground truncate max-w-xs">{siteUrl}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-2" onClick={copySiteUrl}>
              <Copy className="w-4 h-4" /> {t("dashboard.copyLink")}
            </Button>
            <a href={`/site/${user.slug}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" /> {t("dashboard.viewSite")}
              </Button>
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold">{t("dashboard.recentAlerts")}</h2>
            <Link href="/alertes">
              <Button variant="ghost" size="sm" className="gap-2 text-primary hover:text-primary/80">
                {t("dashboard.seeAll")} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-0">
              {alertesLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>
              ) : alertes && alertes.length > 0 ? (
                <div className="divide-y divide-border">
                  {alertes.slice(0, 5).map((alerte) => (
                    <div key={alerte.id} className="p-4 flex items-start gap-4">
                      <div className={`p-2 rounded-full mt-1 ${
                        alerte.gravite === 'haute' ? 'bg-destructive/10 text-destructive' :
                        alerte.gravite === 'moyenne' ? 'bg-orange-500/10 text-orange-600' :
                        'bg-primary/10 text-primary'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-medium">{alerte.client_nom}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alerte.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-500/50 mb-3" />
                  <p className="text-muted-foreground font-medium">{t("dashboard.noAlerts")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-serif font-semibold mb-4">{t("dashboard.quickActions")}</h2>
          <div className="space-y-4">
            <Link href="/clients">
              <Card className="hover:border-primary/50 cursor-pointer transition-colors group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{t("dashboard.clientDirectory")}</h3>
                    <p className="text-sm text-muted-foreground">{t("dashboard.manageContacts")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
