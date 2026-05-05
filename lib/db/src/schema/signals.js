import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { roadsTable } from "./roads";
import { intersectionsTable } from "./intersections";
import { createInsertSchema } from "drizzle-zod";
export const signalsTable = pgTable("signals", {
    id: serial("id").primaryKey(),
    roadId: integer("road_id").notNull().references(() => roadsTable.id, { onDelete: "cascade" }),
    intersectionId: integer("intersection_id").notNull().references(() => intersectionsTable.id, { onDelete: "cascade" }),
    state: text("state").notNull().default("red").$type(),
    greenDuration: integer("green_duration").notNull().default(30),
    redDuration: integer("red_duration").notNull().default(60),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export const insertSignalSchema = createInsertSchema(signalsTable).omit({ id: true, updatedAt: true });
