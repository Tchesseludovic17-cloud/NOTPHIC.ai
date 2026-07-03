import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, useSetupUser } from "@workspace/api-client-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const step1Schema = z.object({
  nom_activite: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  categorie_activite: z.enum(["rendez_vous_regulier", "commerce_fidele", "service_independant"], {
    required_error: "Veuillez sélectionner une catégorie.",
  }),
});

const step2Schema = z.object({
  description_activite: z.string().optional(),
  client_ideal: z.string().optional(),
  reduction_offerte: z.string().optional(),
  code_parrainage_parrain: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema);
type FormValues = z.infer<typeof fullSchema>;

const CATEGORIES = [
  {
    value: "rendez_vous_regulier",
    label: "Rendez-vous réguliers",
    description: "Coachs, thérapeutes, praticiens bien-être",
  },
  {
    value: "commerce_fidele",
    label: "Commerce fidèle",
    description: "Boutiques, restaurants, artisans",
  },
  {
    value: "service_independant",
    label: "Service indépendant",
    description: "Consultants, freelances, agences",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({ query: { retry: false } });
  const setupUser = useSetupUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      nom_activite: "",
      description_activite: "",
      client_ideal: "",
      reduction_offerte: "",
      code_parrainage_parrain: "",
    },
    mode: "onChange",
  });

  async function goToStep2() {
    const valid = await form.trigger(["nom_activite", "categorie_activite"]);
    if (valid) setStep(2);
  }

  function onSubmit(values: FormValues) {
    setupUser.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: "Bienvenue sur Norphic",
            description: "Votre espace a été configuré avec succès.",
          });
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la configuration.",
            variant: "destructive",
          });
        },
      }
    );
  }

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30 py-12">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Norphic</h1>
          <p className="text-muted-foreground mt-2 font-medium">L'assistant qui veille sur vos relations clients</p>
        </div>

        {/* Barre de progression */}
        <div className="flex items-center gap-3 mb-6 px-1">
          {[1, 2].map((n) => (
            <div key={n} className="flex items-center gap-3 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {n}
              </div>
              <div className={`h-1 flex-1 rounded-full transition-colors ${
                n === 1 ? (step >= 2 ? "bg-primary" : "bg-muted") : "hidden"
              }`} />
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* ── Étape 1 : Votre activité ── */}
            {step === 1 && (
              <Card className="border-none shadow-xl bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif">Votre activité</CardTitle>
                  <CardDescription className="text-base">
                    Comment s'appelle votre activité et quelle est sa nature ?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="nom_activite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de votre activité</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Studio Sérénité, Cabinet Dupont…" {...field} className="bg-background" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categorie_activite"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Quelle est votre dynamique client ?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-4"
                          >
                            {CATEGORIES.map((cat) => (
                              <FormItem key={cat.value} className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                                <FormControl>
                                  <RadioGroupItem value={cat.value} />
                                </FormControl>
                                <div className="space-y-1">
                                  <FormLabel className="font-normal cursor-pointer">{cat.label}</FormLabel>
                                  <FormDescription>{cat.description}</FormDescription>
                                </div>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="button" onClick={goToStep2} className="w-full text-lg h-12 font-serif mt-4">
                    Continuer →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Étape 2 : Votre site public ── */}
            {step === 2 && (
              <Card className="border-none shadow-xl bg-card/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif">Votre site public</CardTitle>
                  <CardDescription className="text-base">
                    Ces informations alimentent les signaux de dérive et votre page client.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <FormField
                    control={form.control}
                    name="description_activite"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Décrivez votre activité <span className="text-muted-foreground font-normal">(Optionnel)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="En quelques mots, ce que vous proposez à vos clients…"
                            className="resize-none bg-background min-h-[90px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Visible sur votre page publique et utilisée pour personnaliser les alertes.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_ideal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qui est votre client idéal ? <span className="text-muted-foreground font-normal">(Optionnel)</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Les personnes stressées cherchant à se recentrer…"
                            className="resize-none bg-background min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Aide Norphic à mieux détecter les comportements atypiques.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reduction_offerte"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offre pour réservation en ligne <span className="text-muted-foreground font-normal">(Optionnel)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 5%, 10€, Premier bilan offert…" {...field} className="bg-background" />
                        </FormControl>
                        <FormDescription>Mise en avant sur votre site public pour encourager les prises de contact.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="code_parrainage_parrain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-sm font-normal">Code de parrainage <span className="font-normal">(Optionnel)</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: NORP0001" {...field} className="bg-background max-w-[200px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
                      ← Retour
                    </Button>
                    <Button type="submit" className="flex-2 text-lg h-12 font-serif w-full" disabled={setupUser.isPending}>
                      {setupUser.isPending ? "Configuration…" : "Entrer dans l'espace"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
