import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { usersTable } from "./users";

export const alertesTable = pgTable("alertes", {
  id: serial("id").primaryKey(),
  client_id: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  user_id: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type_signal: text("type_signal").notNull(),
  message: text("message").notNull(),
  message_relance_suggere: text("message_relance_suggere"),
  gravite: text("gravite").notNull().default("moyenne"),
  statut: text("statut").notNull().default("non_lu"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertAlerteSchema = createInsertSchema(alertesTable).omit({ id: true, created_at: true });
export type InsertAlerte = z.infer<typeof insertAlerteSchema>;
export type Alerte = typeof alertesTable.$inferSelect;
