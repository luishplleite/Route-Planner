import { db } from "./db";
import {
  itineraries, stops, financialSummaries,
  type Itinerary, type InsertItinerary,
  type Stop, type InsertStop,
  type FinancialSummary
} from "@shared/schema";
import { eq, and, desc, asc, between, sql } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Itineraries
  createItinerary(itinerary: InsertItinerary): Promise<Itinerary>;
  getItinerary(id: string): Promise<Itinerary | undefined>;
  getActiveItinerary(userId: string): Promise<Itinerary | undefined>;
  getUserItineraries(userId: string): Promise<Itinerary[]>;
  updateItineraryStatus(id: string, status: "active" | "completed"): Promise<Itinerary>;
  updateItineraryEarnings(id: string, amount: string): Promise<void>;

  // Stops
  createStop(stop: InsertStop): Promise<Stop>;
  getStop(id: string): Promise<Stop | undefined>;
  getStopsByItinerary(itineraryId: string): Promise<Stop[]>;
  updateStopStatus(id: string, status: "pending" | "current" | "delivered" | "failed"): Promise<Stop>;
  updateStopOrder(id: string, order: number): Promise<void>;
  
  // Finance
  getFinancialSummary(userId: string, start: string, end: string): Promise<{ totalDeliveries: number, totalEarnings: number }>;
}

export class DatabaseStorage extends authStorage.constructor implements IStorage {
  constructor() {
    super();
  }

  // Itineraries
  async createItinerary(itinerary: InsertItinerary): Promise<Itinerary> {
    const [newItinerary] = await db.insert(itineraries).values(itinerary).returning();
    return newItinerary;
  }

  async getItinerary(id: string): Promise<Itinerary | undefined> {
    const [itinerary] = await db.select().from(itineraries).where(eq(itineraries.id, id));
    return itinerary;
  }

  async getActiveItinerary(userId: string): Promise<Itinerary | undefined> {
    const [itinerary] = await db
      .select()
      .from(itineraries)
      .where(and(eq(itineraries.userId, userId), eq(itineraries.status, "active")))
      .limit(1);
    return itinerary;
  }

  async getUserItineraries(userId: string): Promise<Itinerary[]> {
    return await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.userId, userId))
      .orderBy(desc(itineraries.date));
  }

  async updateItineraryStatus(id: string, status: "active" | "completed"): Promise<Itinerary> {
    const [updated] = await db
      .update(itineraries)
      .set({ status })
      .where(eq(itineraries.id, id))
      .returning();
    return updated;
  }

  async updateItineraryEarnings(id: string, amount: string): Promise<void> {
    await db
      .update(itineraries)
      .set({ totalEarnings: amount })
      .where(eq(itineraries.id, id));
  }

  // Stops
  async createStop(stop: InsertStop): Promise<Stop> {
    const [newStop] = await db.insert(stops).values(stop).returning();
    return newStop;
  }

  async getStop(id: string): Promise<Stop | undefined> {
    const [stop] = await db.select().from(stops).where(eq(stops.id, id));
    return stop;
  }

  async getStopsByItinerary(itineraryId: string): Promise<Stop[]> {
    return await db
      .select()
      .from(stops)
      .where(eq(stops.itineraryId, itineraryId))
      .orderBy(asc(stops.sequenceOrder));
  }

  async updateStopStatus(id: string, status: "pending" | "current" | "delivered" | "failed"): Promise<Stop> {
    const [updated] = await db
      .update(stops)
      .set({ status, deliveryTime: status === 'delivered' ? new Date() : null })
      .where(eq(stops.id, id))
      .returning();
    return updated;
  }

  async updateStopOrder(id: string, order: number): Promise<void> {
    await db.update(stops).set({ sequenceOrder: order }).where(eq(stops.id, id));
  }

  async updateStopSequence(id: string, sequenceOrder: number): Promise<Stop> {
    const [stop] = await db.update(stops)
      .set({ sequenceOrder })
      .where(eq(stops.id, id))
      .returning();
    if (!stop) throw new Error("Stop not found");
    return stop;
  }

  // Finance
  async getFinancialSummary(userId: string, start: string, end: string): Promise<{ totalDeliveries: number, totalEarnings: number }> {
    // This is a simplified calculation directly from itineraries for now
    const result = await db
      .select({
        totalEarnings: sql<string>`sum(${itineraries.totalEarnings})`,
        count: sql<number>`count(*)` // This isn't total deliveries, but trips. 
        // Real logic requires joining stops or trusting totalEarnings in itinerary.
        // For MVP, we'll trust totalEarnings in itinerary is updated correctly.
      })
      .from(itineraries)
      .where(
        and(
          eq(itineraries.userId, userId),
          between(itineraries.date, start, end)
        )
      );

    // To get actual delivery count, we should query stops.
    const deliveryCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(stops)
      .leftJoin(itineraries, eq(stops.itineraryId, itineraries.id))
      .where(
        and(
          eq(itineraries.userId, userId),
          eq(stops.status, 'delivered'),
          between(itineraries.date, start, end)
        )
      );

    return {
      totalDeliveries: Number(deliveryCount[0]?.count || 0),
      totalEarnings: Number(result[0]?.totalEarnings || 0)
    };
  }
}

export const storage = new DatabaseStorage();
