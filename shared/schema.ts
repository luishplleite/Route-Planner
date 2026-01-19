import { pgTable, text, serial, integer, boolean, timestamp, numeric, date, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

export * from "./models/auth";

// === TABLE DEFINITIONS ===

export const itineraries = pgTable("itineraries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: date("date").notNull().defaultNow(),
  status: text("status", { enum: ["active", "completed"] }).default("active").notNull(),
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).default("0.00").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const stops = pgTable("stops", {
  id: uuid("id").primaryKey().defaultRandom(),
  itineraryId: uuid("itinerary_id").notNull().references(() => itineraries.id, { onDelete: "cascade" }),
  fixedIdentifier: text("fixed_identifier").notNull(), // The number written on the package (1, 2, 3...)
  addressFull: text("address_full").notNull(),
  latitude: numeric("latitude").notNull(), // Using numeric for precision, map to number in app
  longitude: numeric("longitude").notNull(),
  sequenceOrder: integer("sequence_order").notNull(), // Optimized order
  status: text("status", { enum: ["pending", "current", "delivered", "failed"] }).default("pending").notNull(),
  deliveryTime: timestamp("delivery_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const financialSummaries = pgTable("financial_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  bonusApplied: boolean("bonus_applied").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// === RELATIONS ===

export const itinerariesRelations = relations(itineraries, ({ one, many }) => ({
  user: one(users, {
    fields: [itineraries.userId],
    references: [users.id],
  }),
  stops: many(stops),
}));

export const stopsRelations = relations(stops, ({ one }) => ({
  itinerary: one(itineraries, {
    fields: [stops.itineraryId],
    references: [itineraries.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertItinerarySchema = createInsertSchema(itineraries).omit({ 
  id: true, 
  createdAt: true,
  totalEarnings: true 
});

export const insertStopSchema = createInsertSchema(stops).omit({ 
  id: true, 
  createdAt: true,
  deliveryTime: true
});

// === EXPLICIT TYPES ===

export type Itinerary = typeof itineraries.$inferSelect;
export type InsertItinerary = z.infer<typeof insertItinerarySchema>;

export type Stop = typeof stops.$inferSelect;
export type InsertStop = z.infer<typeof insertStopSchema>;

export type FinancialSummary = typeof financialSummaries.$inferSelect;

// Request Types
export type CreateItineraryRequest = { date?: string }; // Date string YYYY-MM-DD
export type AddStopRequest = {
  addressFull: string;
  latitude: number;
  longitude: number;
  fixedIdentifier?: string; // Optional, backend can generate
  notes?: string;
};
export type UpdateStopStatusRequest = {
  status: "pending" | "current" | "delivered" | "failed";
};
export type OptimizeRouteRequest = {
  currentLatitude: number;
  currentLongitude: number;
};
