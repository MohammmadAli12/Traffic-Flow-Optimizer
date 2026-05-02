import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const intersectionsTable = pgTable("intersections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntersectionSchema = createInsertSchema(intersectionsTable).omit({ id: true, createdAt: true });
export type InsertIntersection = z.infer<typeof insertIntersectionSchema>;
export type Intersection = typeof intersectionsTable.$inferSelect;
