import { useParams } from "wouter";
import { useGetSitePublic, useSubmitContact } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tag, MapPin, Heart, Mail, Phone, CalendarCheck } from "lucide-react";

const formSchema = z.object({
  nom: z.string().min(2, "Votre nom est requis"),
  telephone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  message: z.string().optional(),
});

export default function SitePublic() {
  const { slug } = useParams<{ slug: string }>();
  const { data: site, isLoading, isError } = useGetSitePublic(slug || "");
  const submitContact = useSubmitContact();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      telephone: "",
      email: "",
      message: "",
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!slug) return;
    submitContact.mutate({ slug, data: values }, {
      onSuccess: () => {
        toast({
          title: "Demande envoyée",
          description: "Votre demande de contact a bien été transmise.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#d47a6b] border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (isError || !site) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-serif text-[#2c2825] mb-2">Page introuvable</h1>
        <p className="text-[#6e6863]">Cette page professionnelle n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-[#2c2825] font-sans selection:bg-[#d47a6b] selection:text-white">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 md:px-8 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[#f2ede4] -skew-y-3 origin-top-left -z-10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center px-3 py-1 mb-6 rounded-full border border-[#d47a6b]/30 bg-[#d47a6b]/5 text-[#d47a6b] text-sm font-medium tracking-wide">
            {site.categorie_activite.replace(/_/g, ' ')}
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-[#1f1b18] tracking-tight mb-6">
            {site.nom_activite}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
        
        {/* Banner Reduction */}
        {site.reduction_offerte && (
          <div className="bg-[#d47a6b] text-white p-6 rounded-2xl shadow-lg transform hover:-translate-y-1 transition-transform text-center flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
            <Tag className="w-8 h-8 mb-3 opacity-90" />
            <h3 className="text-xl font-serif font-medium mb-1">Offre spéciale réservation en ligne</h3>
            <p className="text-white/90 text-lg">Bénéficiez de <strong className="font-bold text-xl">{site.reduction_offerte}</strong> de réduction</p>
          </div>
        )}

        {/* Sections */}
        <div className="grid md:grid-cols-2 gap-12">
          {site.description_activite && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#d47a6b] mb-2">
                <Heart className="w-5 h-5" />
                <h2 className="text-xl font-serif font-semibold text-[#1f1b18]">Ce que je propose</h2>
              </div>
              <p className="text-[#5c544d] leading-relaxed text-lg whitespace-pre-line">
                {site.description_activite}
              </p>
            </section>
          )}

          {site.client_ideal && (
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-[#d47a6b] mb-2">
                <MapPin className="w-5 h-5" />
                <h2 className="text-xl font-serif font-semibold text-[#1f1b18]">À qui je m'adresse</h2>
              </div>
              <p className="text-[#5c544d] leading-relaxed text-lg whitespace-pre-line">
                {site.client_ideal}
              </p>
            </section>
          )}
        </div>

        {/* Contact Form */}
        <section className="mt-20 pt-16 border-t border-[#e8e2d9]">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-serif font-bold text-[#1f1b18] mb-3">Prendre rendez-vous</h2>
            <p className="text-[#5c544d]">Laissez-moi vos coordonnées, je vous recontacterai rapidement.</p>
          </div>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
            <CardContent className="p-8 md:p-10">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2c2825]">Nom complet *</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" className="bg-[#faf8f5] border-[#e8e2d9] focus-visible:ring-[#d47a6b]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="telephone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2c2825]">Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre numéro" className="bg-[#faf8f5] border-[#e8e2d9] focus-visible:ring-[#d47a6b]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2c2825]">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="votre@email.com" className="bg-[#faf8f5] border-[#e8e2d9] focus-visible:ring-[#d47a6b]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2c2825]">Votre message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Vos disponibilités, vos besoins..." 
                            className="resize-none min-h-[120px] bg-[#faf8f5] border-[#e8e2d9] focus-visible:ring-[#d47a6b]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg bg-[#d47a6b] hover:bg-[#c06859] text-white font-serif tracking-wide" 
                    disabled={submitContact.isPending}
                  >
                    {submitContact.isPending ? "Envoi en cours..." : "Envoyer ma demande"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>

      </div>

      <footer className="bg-[#2c2825] text-[#e8e2d9] py-8 text-center mt-20">
        <p className="text-sm opacity-70">Propulsé par Norphic</p>
      </footer>
    </div>
  );
}