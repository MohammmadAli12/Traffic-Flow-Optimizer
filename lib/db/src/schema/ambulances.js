import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { roadsTable } from "./roads";
import { hospitalsTable } from "./hospitals";
export const ambulancesTable = pgTable("ambulances", {
    id: serial("id").primaryKey(),
    sourceRoadId: integer("source_road_id").notNull().references(() => roadsTable.id, { onDelete: "cascade" }),
    targetHospitalId: integer("target_hospital_id").notNull().references(() => hospitalsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active").$type(),
    dispatchedAt: timestamp("dispatched_at").defaultNow().notNull(),
});
export const insertAmbulanceSchema = createInsertSchema(ambulancesTable).omit({ id: true, dispatchedAt: true, status: true });
