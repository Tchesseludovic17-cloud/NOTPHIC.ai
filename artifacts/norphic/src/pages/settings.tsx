import { Layout } from "@/components/layout";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

const formSchema = z.object({
  nom_activite: z.string().min(2, "Le nom est requis"),
  description_activite: z.string().optional(),
  client_ideal: z.string().optional(),
  reduction_offerte: z.string().optional(),
});

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom_activite: "",
      description_activite: "",
      client_ideal: "",
      reduction_offerte: "",
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        nom_activite: user.nom_activite,
        description_activite: user.description_activite || "",
        client_ideal: user.client_ideal || "",
        reduction_offerte: user.reduction_offerte || "",
      });
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateMe.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profil mis à jour" });
      }
    });
  };

  return (
    <Layout>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground mt-1">Configurez votre espace de travail.</p>
        </div>
        {user?.slug && (
          <Link href={`/site/${user.slug}`}>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Voir mon site public
            </Button>
          </Link>
        )}
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Profil de l'activité</CardTitle>
            <CardDescription>
              Ces informations permettent à Norphic de mieux comprendre votre métier et s'affichent sur votre site public.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4 text-muted-foreground">Chargement...</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Email de connexion</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm">{user?.email}</div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Catégorie</Label>
                      <div className="px-3 py-2 bg-muted rounded-md text-sm capitalize">
                        {user?.categorie_activite?.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-4">
                    <FormField
                      control={form.control}
                      name="nom_activite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'activité</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                          <FormLabel>Description (Ce que je propose)</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_ideal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client idéal (À qui je m'adresse)</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none min-h-[80px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reduction_offerte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Réduction offerte</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: 10% sur la première séance" />
                          </FormControl>
                          <FormDescription>S'affiche comme bannière sur votre site public.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={updateMe.isPending}>
                    {updateMe.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Small helper since we don't import Label globally in this snippet
function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`text-sm font-medium leading-none ${className}`}>{children}</label>;
}