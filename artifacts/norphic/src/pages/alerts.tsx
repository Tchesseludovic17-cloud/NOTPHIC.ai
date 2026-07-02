import { Layout } from "@/components/layout";
import { useListAlertes, useTraiterAlerte, getListAlertesQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, MessageSquare, Clock, XCircle, RefreshCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ALERTE_LABELS: Record<string, string> = {
  silence: "Silence client",
  rupture_frequence: "Rupture de fréquence",
  annulation_sans_reprise: "Annulation sans reprise",
  non_renouvellement: "Non-renouvellement"
};

const ALERTE_ICONS: Record<string, any> = {
  silence: Clock,
  rupture_frequence: RefreshCcw,
  annulation_sans_reprise: XCircle,
  non_renouvellement: AlertCircle
};

export default function Alertes() {
  const [showTreated, setShowTreated] = useState(false);
  const statut = showTreated ? "tous" : "non_lu";
  
  const { data: alertes, isLoading } = useListAlertes(
    { statut },
    { query: { queryKey: getListAlertesQueryKey({ statut }) } }
  );
  
  const traiterAlerte = useTraiterAlerte();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleTraiter = (id: number) => {
    traiterAlerte.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertesQueryKey({ statut: "non_lu" }) });
        queryClient.invalidateQueries({ queryKey: getListAlertesQueryKey({ statut: "tous" }) });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Alerte traitée", description: "Bravo pour votre réactivité !" });
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Signaux d'alerte</h1>
          <p className="text-muted-foreground mt-1">Les clients qui nécessitent votre attention.</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-card px-4 py-2 rounded-md shadow-sm">
          <Switch id="show-treated" checked={showTreated} onCheckedChange={setShowTreated} />
          <Label htmlFor="show-treated">Afficher les alertes traitées</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement des alertes...</div>
      ) : alertes && alertes.length > 0 ? (
        <div className="grid gap-4">
          {alertes.map((alerte) => {
            const Icon = ALERTE_ICONS[alerte.type_signal] || AlertCircle;
            const isTraitee = alerte.statut === "traite";
            
            return (
              <Card key={alerte.id} className={`transition-all ${isTraitee ? 'opacity-60 bg-muted/50' : 'hover:shadow-md border-l-4'} ${
                !isTraitee && alerte.gravite === 'haute' ? 'border-l-destructive' :
                !isTraitee && alerte.gravite === 'moyenne' ? 'border-l-orange-500' :
                !isTraitee ? 'border-l-primary' : 'border-l-transparent'
              }`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-full ${
                          isTraitee ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">{alerte.client_nom}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">
                              {ALERTE_LABELS[alerte.type_signal]}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-muted-foreground">
                              {format(new Date(alerte.created_at), "dd MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="mt-4 text-foreground/90">{alerte.message}</p>
                      
                      {alerte.message_relance_suggere && !isTraitee && (
                        <div className="mt-4 bg-accent/50 p-4 rounded-md flex gap-3 items-start border border-accent">
                          <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">Suggestion de message :</p>
                            <p className="text-sm text-muted-foreground italic">"{alerte.message_relance_suggere}"</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row md:flex-col justify-end items-end gap-2 md:border-l md:border-border md:pl-6">
                      {!isTraitee ? (
                        <Button 
                          onClick={() => handleTraiter(alerte.id)}
                          className="w-full md:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marqué comme traité
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Traité
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-none shadow-sm bg-card/50">
          <CardContent className="p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mb-4" />
            <h3 className="text-xl font-serif font-medium text-foreground mb-2">Tout est calme</h3>
            <p className="text-muted-foreground max-w-md">
              Vous avez traité toutes vos alertes. Vos clients sont entre de bonnes mains.
            </p>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
}