import { pgTable, serial, text, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { intersectionsTable } from "./intersections";
export const hospitalsTable = pgTable("hospitals", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    lat: real("lat").notNull().default(26.8467),
    lng: real("lng").notNull().default(80.9462),
    nearestIntersectionId: integer("nearest_intersection_id").notNull().references(() => intersectionsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertHospitalSchema = createInsertSchema(hospitalsTable).omit({ id: true, createdAt: true });
