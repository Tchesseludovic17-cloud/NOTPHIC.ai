import { useGetCompanyTwin } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Activity, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const monthNames: Record<string, string> = {
  "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
  "05": "Mai", "06": "Juin", "07": "Juil", "08": "Août",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc"
};

function formatMois(YYYYMM: string) {
  const [year, month] = YYYYMM.split("-");
  const monthName = monthNames[month] || month;
  return `${monthName} ${year}`;
}

export default function CompanyTwinPage() {
  const { data, isLoading } = useGetCompanyTwin();

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-muted-foreground">Chargement de votre mémoire...</div>
      </Layout>
    );
  }

  const chartData = data?.historique_mensuel
    ?.filter(m => m.alertes_generees > 0 || m.clients_sauves > 0)
    .map(m => ({
      name: formatMois(m.mois),
      "Alertes générées": m.alertes_generees,
      "Clients sauvés": m.clients_sauves
    })) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Mémoire de votre activité</h1>
        <p className="text-muted-foreground mt-1">Ce que Norphic a appris de votre business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients suivis</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.total_clients ?? "-"}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients actifs</CardTitle>
            <Activity className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{data?.clients_actifs ?? "-"}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clients en alerte</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{data?.clients_en_alerte ?? "-"}</div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fréquence moyenne</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.frequence_moyenne_jours ? `${data.frequence_moyenne_jours} jours` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <h2 className="text-xl font-serif font-semibold mb-4">Efficacité des relances</h2>
          <Card className="h-[300px]">
            <CardHeader>
              <CardTitle className="text-lg">Taux de réussite</CardTitle>
              <CardDescription>Performance de vos actions de relance</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.taux_relance_reussie !== null && data?.taux_relance_reussie !== undefined ? (
                <div className="flex flex-col space-y-6 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-primary">{Math.round(data.taux_relance_reussie)}%</span>
                    <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                  </div>
                  <Progress value={data.taux_relance_reussie} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    {data.relances_reussies} relances réussies sur {data.total_relances} effectuées
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="p-3 bg-muted rounded-full">
                    <Activity className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground px-4">
                    Pas encore assez de données — marquez vos alertes comme traitées pour commencer à mesurer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-serif font-semibold mb-4">Historique</h2>
          <Card className="h-[300px]">
            <CardContent className="p-6 h-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'var(--muted)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar dataKey="Alertes générées" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Clients sauvés" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Clock className="w-8 h-8 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-medium">Votre historique se construira au fil des relances effectuées.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}