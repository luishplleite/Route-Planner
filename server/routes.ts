import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { stops } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Itineraries
  app.get(api.itineraries.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const items = await storage.getUserItineraries(userId);
    res.json(items);
  });

  app.post(api.itineraries.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.itineraries.create.input.parse(req.body);
      const userId = req.user.claims.sub;
      
      const itinerary = await storage.createItinerary({
        userId,
        date: input.date || new Date().toISOString().split('T')[0],
        status: "active",
        totalEarnings: "0.00"
      });
      res.status(201).json(itinerary);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.itineraries.getActive.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const active = await storage.getActiveItinerary(userId);
    res.json(active || null);
  });

  app.get(api.itineraries.get.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const itinerary = await storage.getItinerary(req.params.id);
    
    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found" });
    }
    
    if (itinerary.userId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const itineraryStops = await storage.getStopsByItinerary(req.params.id);
    res.json({ ...itinerary, stops: itineraryStops });
  });

  // Stops
  app.post(api.stops.add.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.stops.add.input.parse(req.body);
      const itineraryId = req.params.id;
      
      // Determine next fixed identifier if not provided
      // Ideally we count existing stops + 1
      const existingStops = await storage.getStopsByItinerary(itineraryId);
      const nextNum = existingStops.length + 1;
      
      const stop = await storage.createStop({
        itineraryId,
        addressFull: input.addressFull,
        latitude: input.latitude.toString(),
        longitude: input.longitude.toString(),
        fixedIdentifier: input.fixedIdentifier || String(nextNum),
        sequenceOrder: nextNum, // Default to append
        notes: input.notes,
        status: "pending"
      });
      res.status(201).json(stop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.stops.updateStatus.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.stops.updateStatus.input.parse(req.body);
      const stopId = req.params.id;
      
      const updatedStop = await storage.updateStopStatus(stopId, input.status);
      
      if (input.status === 'delivered') {
        // Update earnings logic
        const itinerary = await storage.getItinerary(updatedStop.itineraryId);
        if (itinerary) {
          const currentEarnings = parseFloat(itinerary.totalEarnings);
          const newEarnings = (currentEarnings + 2.80).toFixed(2);
          await storage.updateItineraryEarnings(itinerary.id, newEarnings);
          
          // Bonus Logic Check (Sunday & > 50 deliveries)
          // Simplified: We assume frontend/user knows this rule or we implement a nightly job.
          // For realtime, we could check here.
          const date = new Date(itinerary.date);
          const isSunday = date.getDay() === 0; // 0 is Sunday
          if (isSunday) {
            const stops = await storage.getStopsByItinerary(itinerary.id);
            const deliveredCount = stops.filter(s => s.status === 'delivered').length;
            if (deliveredCount === 51) { // Trigger exactly once when crossing 50
               // Add bonus
               const bonusEarnings = (parseFloat(newEarnings) + 100.00).toFixed(2);
               await storage.updateItineraryEarnings(itinerary.id, bonusEarnings);
            }
          }
        }
      }
      
      res.json(updatedStop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.stops.optimize.path, isAuthenticated, async (req, res) => {
     // Placeholder for Mapbox Optimization API
     // Since we might not have a key, we'll just re-return the list or shuffle for demo if needed.
     // In a real app, we'd fetch optimization API here.
     
     const itineraryId = req.params.id;
     const currentStops = await storage.getStopsByItinerary(itineraryId);
     
     // Mock Optimization: Sort by sequenceOrder (no-op)
     // If we had Mapbox Key:
     // 1. Construct payload
     // 2. Call https://api.mapbox.com/optimized-trips/v1/...
     // 3. Update sequenceOrder in DB based on result
     
     res.json(currentStops);
  });

  // Finance
  app.get(api.finance.getSummary.path, isAuthenticated, async (req: any, res) => {
     const { startDate, endDate } = req.query;
     const userId = req.user.claims.sub;
     
     if (!startDate || !endDate) {
       return res.status(400).json({ message: "Start and end date required" });
     }
     
     const summary = await storage.getFinancialSummary(userId, String(startDate), String(endDate));
     res.json({
       ...summary,
       days: [] // TODO: detail by day
     });
  });

  return httpServer;
}
