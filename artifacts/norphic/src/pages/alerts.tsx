import { Layout } from "@/components/layout";
import { useListAlertes, useTraiterAlerte, useSubmitFeedback, useSuiviAlerte, getListAlertesQueryKey, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, MessageSquare, Clock, XCircle, RefreshCcw, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ALERTE_LABELS: Record<string, string> = {
  silence: "Silence client",
  rupture_frequence: "Rupture de fréquence",
  annulation_sans_reprise: "Annulation sans reprise",
  non_renouvellement: "Non-renouvellement",
  absence_jour_habituel: "Absence jour habituel"
};

const ALERTE_ICONS: Record<string, any> = {
  silence: Clock,
  rupture_frequence: RefreshCcw,
  annulation_sans_reprise: XCircle,
  non_renouvellement: AlertCircle,
  absence_jour_habituel: Clock
};

export default function Alertes() {
  const [showTreated, setShowTreated] = useState(false);
  
  // We need to fetch both non_lu and tous if we want to show the suivi section
  // but let's just fetch 'tous' always to derive both lists if needed, 
  // or fetch based on toggle for main list, and a separate query for suivi.
  // The simplest is to fetch 'tous' and filter locally, or just fetch the active ones.
  // Actually, we can just fetch based on showTreated for the main list.
  const statut = showTreated ? "tous" : "non_lu";
  const { data: alertes, isLoading } = useListAlertes(
    { statut },
    { query: { queryKey: getListAlertesQueryKey({ statut }) } }
  );

  // For Suivi post-relance, we need treated alerts where suivi_demande is false/null, and traite_at is > 3 days ago.
  // To avoid duplicate heavy fetching, we can just fetch `tous` in a separate query or use the one if we have it.
  const { data: allAlertes, isLoading: isLoadingAll } = useListAlertes(
    { statut: "tous" },
    { query: { queryKey: getListAlertesQueryKey({ statut: "tous" }) } }
  );

  const alertesSuivi = useMemo(() => {
    if (!allAlertes) return [];
    return allAlertes.filter(a => {
      if (a.statut !== 'traite' || a.suivi_demande !== false || !a.traite_at) return false;
      // Also need to check if we haven't answered already (suivi_repondu is usually set to true when answered, wait... 
      // the schema has suivi_repondu. Let's just rely on suivi_demande changing when we answer. 
      // Actually, when we answer, what changes? We call useSuiviAlerte with { repondu: true/false }
      // This endpoint likely updates suivi_demande to true or updates suivi_repondu.
      // The task says "Show treated alerts where suivi_demande is false". 
      // If it's literally `false`, wait, default is null. Let's show if `suivi_demande !== true`.
      if (a.suivi_demande === true) return false;
      const days = differenceInDays(new Date(), new Date(a.traite_at));
      return days >= 3;
    });
  }, [allAlertes]);
  
  const traiterAlerte = useTraiterAlerte();
  const submitFeedback = useSubmitFeedback();
  const suiviAlerte = useSuiviAlerte();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListAlertesQueryKey({ statut: "non_lu" }) });
    queryClient.invalidateQueries({ queryKey: getListAlertesQueryKey({ statut: "tous" }) });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  }

  const handleTraiter = (id: number) => {
    traiterAlerte.mutate({ id }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Alerte traitée", description: "Bravo pour votre réactivité !" });
      }
    });
  };

  const handleCopyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({ title: "Copié !", description: "Le message a été copié dans le presse-papiers." });
  };

  const handleFeedback = (alerte_id: number, type: 'alerte_utile' | 'alerte_pas_utile') => {
    submitFeedback.mutate({ data: { alerte_id, type_feedback: type } }, {
      onSuccess: () => {
        toast({ title: "Merci pour votre retour", description: "Cela nous aide à améliorer Norphic." });
      }
    });
  };

  const handleSuivi = (id: number, repondu: boolean) => {
    suiviAlerte.mutate({ id, data: { repondu } }, {
      onSuccess: () => {
        invalidateAll();
        toast({ title: "Suivi enregistré", description: "L'information a été mise à jour." });
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

      {alertesSuivi.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-serif font-medium mb-4 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-primary" />
            Suivi post-relance
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {alertesSuivi.map(alerte => (
              <Card key={`suivi-${alerte.id}`} className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-3">Le client <span className="font-bold">{alerte.client_nom}</span> a-t-il répondu ?</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSuivi(alerte.id, true)}>
                      Oui
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleSuivi(alerte.id, false)}>
                      Non
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

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
                        <div className="mt-4 bg-accent/50 p-4 rounded-md border border-accent">
                          <div className="flex gap-3 items-start mb-3">
                            <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-foreground mb-1">Suggestion de message :</p>
                              <p className="text-sm text-muted-foreground italic">"{alerte.message_relance_suggere}"</p>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" className="gap-2" onClick={() => handleCopyMessage(alerte.message_relance_suggere!)}>
                              <Copy className="w-4 h-4" />
                              Copier le message
                            </Button>
                          </div>
                        </div>
                      )}

                      {!isTraitee && (
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground mr-2">Ce signal était-il pertinent ?</span>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50" onClick={() => handleFeedback(alerte.id, 'alerte_utile')}>
                            <ThumbsUp className="w-3 h-3" /> Utile
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleFeedback(alerte.id, 'alerte_pas_utile')}>
                            <ThumbsDown className="w-3 h-3" /> Pas utile
                          </Button>
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
                          Marquer comme traité
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