import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { intersectionsTable } from "./intersections";

export const roadsTable = pgTable("roads", {
  id: serial("id").primaryKey(),
  intersectionId: integer("intersection_id").notNull().references(() => intersectionsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  direction: text("direction").notNull().$type<"North" | "South" | "East" | "West">(),
  carCount: integer("car_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoadSchema = createInsertSchema(roadsTable).omit({ id: true, createdAt: true, carCount: true });
export type InsertRoad = z.infer<typeof insertRoadSchema>;
export type Road = typeof roadsTable.$inferSelect;
