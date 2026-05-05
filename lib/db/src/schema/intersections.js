import { pgTable, serial, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export const intersectionsTable = pgTable("intersections", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    location: text("location").notNull(),
    lat: real("lat").notNull().default(26.8467),
    lng: real("lng").notNull().default(80.9462),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const insertIntersectionSchema = createInsertSchema(intersectionsTable).omit({ id: true, createdAt: true });
