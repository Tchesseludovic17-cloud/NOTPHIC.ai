import { pgTable, serial, integer, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const historiqueVisitesTable = pgTable("historique_visites", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  date_visite: date("date_visite").notNull(),
  via: text("via").notNull().default("manuel"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertHistoriqueVisiteSchema = createInsertSchema(historiqueVisitesTable).omit({ id: true, created_at: true });
export type InsertHistoriqueVisite = z.infer<typeof insertHistoriqueVisiteSchema>;
export type HistoriqueVisite = typeof historiqueVisitesTable.$inferSelect;
