import { Layout } from "@/components/layout";
import { useListClients, useMarkClientVisit, getListClientsQueryKey, useCreateClient, useDeleteClient } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, UserCheck, Trash2, AlertCircle, Users } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "@/components/ui/form";

const formSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  telephone: z.string().optional(),
});

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const markVisit = useMarkClientVisit();
  const deleteClient = useDeleteClient();
  const createClient = useCreateClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const filteredClients = clients?.filter(c => 
    c.nom.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const handleMarkVisit = (id: number, nom: string) => {
    markVisit.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({
          title: "Visite enregistrée",
          description: `La visite de ${nom} a été enregistrée aujourd'hui.`,
        });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      deleteClient.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Client supprimé" });
        }
      });
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nom: "", email: "", telephone: "" }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createClient.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: "Client ajouté" });
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Annuaire clients</h1>
          <p className="text-muted-foreground mt-1">Vos relations, suivies avec attention.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
              <DialogDescription>
                Ajoutez un nouveau client à votre base.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="nom" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (optionnel)</FormLabel>
                    <FormControl><Input {...field} type="email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="telephone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (optionnel)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={createClient.isPending} className="w-full">
                  {createClient.isPending ? "Ajout..." : "Enregistrer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-6 border-none shadow-sm">
        <div className="p-4 flex items-center gap-2 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Rechercher un client..." 
            className="border-none shadow-none focus-visible:ring-0 px-0 h-auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement des clients...</div>
        ) : filteredClients && filteredClients.length > 0 ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Dernière visite</TableHead>
                <TableHead>Alertes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nom}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {client.email || client.telephone || "-"}
                  </TableCell>
                  <TableCell>
                    {client.derniere_visite 
                      ? format(new Date(client.derniere_visite), "dd MMM yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {client.nb_alertes_actives > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <AlertCircle className="w-3 h-3" />
                        {client.nb_alertes_actives}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMarkVisit(client.id, client.nom)}
                      disabled={markVisit.isPending}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Présent
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(client.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Aucun client</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Commencez par ajouter vos premiers clients pour que Norphic puisse veiller sur eux.
            </p>
          </div>
        )}
      </Card>
    </Layout>
  );
}