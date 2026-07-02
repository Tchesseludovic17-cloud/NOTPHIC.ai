import { useEffect } from "react";
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

const formSchema = z.object({
  nom_activite: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  categorie_activite: z.enum(["rendez_vous_regulier", "commerce_fidele", "service_independant"], {
    required_error: "Veuillez sélectionner une catégorie.",
  }),
  description_activite: z.string().optional(),
});

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetMe({
    query: { retry: false },
  });
  const setupUser = useSetupUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_activite: "",
      description_activite: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
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
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-serif text-foreground tracking-tight">Norphic</h1>
          <p className="text-muted-foreground mt-2 font-medium">L'assistant qui veille sur vos relations clients</p>
        </div>

        <Card className="border-none shadow-xl bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">Commençons</CardTitle>
            <CardDescription className="text-base">
              Parlez-nous un peu de votre activité pour que nous puissions adapter Norphic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="nom_activite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de votre activité</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Studio Sérénité, Cabinet Dupont..." {...field} className="bg-background" />
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
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                            <FormControl>
                              <RadioGroupItem value="rendez_vous_regulier" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-normal cursor-pointer">
                                Rendez-vous réguliers
                              </FormLabel>
                              <FormDescription>
                                Coachs, thérapeutes, praticiens bien-être
                              </FormDescription>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                            <FormControl>
                              <RadioGroupItem value="commerce_fidele" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-normal cursor-pointer">
                                Commerce fidèle
                              </FormLabel>
                              <FormDescription>
                                Boutiques, restaurants, artisans
                              </FormDescription>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                            <FormControl>
                              <RadioGroupItem value="service_independant" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-normal cursor-pointer">
                                Service indépendant
                              </FormLabel>
                              <FormDescription>
                                Consultants, freelances, agences
                              </FormDescription>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_activite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description brève (Optionnel)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="En quelques mots..." 
                          className="resize-none bg-background" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full text-lg h-12 font-serif" disabled={setupUser.isPending}>
                  {setupUser.isPending ? "Configuration..." : "Entrer dans l'espace"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}