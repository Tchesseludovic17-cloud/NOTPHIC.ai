import { pgTable, serial, integer, text, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const affiliationsTable = pgTable("affiliations", {
  id: serial("id").primaryKey(),
  user_id_parrain: integer("user_id_parrain").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  user_id_filleul: integer("user_id_filleul").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  statut_actif: boolean("statut_actif").notNull().default(true),
  taux_commission_actuel: real("taux_commission_actuel").notNull().default(20),
  filleul_actif_depuis: timestamp("filleul_actif_depuis"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliationSchema = createInsertSchema(affiliationsTable).omit({ id: true, created_at: true });
export type InsertAffiliation = z.infer<typeof insertAffiliationSchema>;
export type Affiliation = typeof affiliationsTable.$inferSelect;
