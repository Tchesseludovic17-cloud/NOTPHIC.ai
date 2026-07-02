import { Layout } from "@/components/layout";
import { useGetMyAffiliations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, Gift, Users, CreditCard, ExternalLink, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function Affiliations() {
  const { data: stats, isLoading } = useGetMyAffiliations();
  const { toast } = useToast();

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title,
      description: "Copié dans le presse-papiers !",
    });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
          <Gift className="w-8 h-8 text-primary" />
          Programme d'affiliation
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Invitez d'autres professionnels à utiliser Norphic et gagnez des commissions sur leurs abonnements : 
          20% le 1er mois, puis 10% tant que le client reste actif (après 30 jours d'activité minimum).
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des données...</div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <Gift className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Votre code parrain</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold tracking-tight">{stats.code_parrainage}</div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(stats.code_parrainage, "Code copié")}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-muted p-3 rounded-xl">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                </div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Filleuls (Actifs / Total)</div>
                <div className="text-3xl font-bold tracking-tight">
                  {stats.filleuls_actifs} <span className="text-muted-foreground text-xl">/ {stats.total_filleuls}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-500/10 p-3 rounded-xl">
                    <CreditCard className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mb-1 text-sm font-medium text-muted-foreground">Commission estimée</div>
                <div className="text-3xl font-bold tracking-tight text-emerald-600">
                  {stats.commission_totale_estimee} €
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Votre lien de parrainage</CardTitle>
              <CardDescription>Partagez ce lien directement avec votre réseau</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg border">
                <div className="flex-1 px-3 text-sm font-medium truncate select-all">
                  {stats.lien_parrainage}
                </div>
                <Button onClick={() => copyToClipboard(stats.lien_parrainage, "Lien copié")} className="shrink-0 gap-2">
                  <Copy className="w-4 h-4" />
                  Copier le lien
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vos filleuls</CardTitle>
              <CardDescription>Suivez l'activité des personnes que vous avez parrainées.</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.filleuls.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Aucun filleul pour le moment</h3>
                  <p className="text-muted-foreground">Partagez votre code ou votre lien pour commencer à gagner des commissions.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activité</TableHead>
                        <TableHead>Date d'inscription</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Taux commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.filleuls.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.nom_activite}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(f.created_at), "dd MMM yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            {f.statut_actif ? (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Actif</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {f.taux_commission_actuel}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </Layout>
  );
}