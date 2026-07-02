import { pgTable, serial, text, timestamp, integer, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const clientsTable = pgTable("clients", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  nom: text("nom").notNull(),
  telephone: text("telephone"),
  email: text("email"),
  date_dernier_contact: date("date_dernier_contact"),
  derniere_visite: date("derniere_visite"),
  frequence_moyenne_jours: integer("frequence_moyenne_jours"),
  jour_habituel: text("jour_habituel"),
  dernier_rdv_statut: text("dernier_rdv_statut"),
  date_dernier_rdv: date("date_dernier_rdv"),
  date_prochain_rdv: date("date_prochain_rdv"),
  abonnement_actif: boolean("abonnement_actif"),
  abonnement_date_renouvellement: date("abonnement_date_renouvellement"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertClientSchema = createInsertSchema(clientsTable).omit({ id: true, created_at: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clientsTable.$inferSelect;
