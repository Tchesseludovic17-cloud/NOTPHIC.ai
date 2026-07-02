import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { alertesTable } from "./alertes";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  alerte_id: integer("alerte_id").references(() => alertesTable.id, { onDelete: "set null" }),
  type_feedback: text("type_feedback").notNull(),
  commentaire: text("commentaire"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, created_at: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
