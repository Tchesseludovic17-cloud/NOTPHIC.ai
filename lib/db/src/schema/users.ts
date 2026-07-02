import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email"),
  nom_activite: text("nom_activite").notNull(),
  slug: text("slug").notNull().default(""),
  categorie_activite: text("categorie_activite").notNull(),
  description_activite: text("description_activite"),
  client_ideal: text("client_ideal"),
  reduction_offerte: text("reduction_offerte"),
  plan: text("plan").notNull().default("gratuit"),
  code_parrainage: text("code_parrainage"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, created_at: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
