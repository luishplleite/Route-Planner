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
    const itineraryId = req.params.id;
    const { currentLatitude, currentLongitude } = req.body;

    const currentStops = await storage.getStopsByItinerary(itineraryId);
    const pendingStops = currentStops.filter(s => s.status === 'pending' || s.status === 'current');

    if (pendingStops.length === 0) {
      return res.json(currentStops);
    }

    const token = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_PUBLIC_KEY;
    if (!token) {
      console.error("Mapbox token missing for optimization");
      return res.status(500).json({ message: "Configuração do Mapbox ausente" });
    }

    try {
      // 1. Prepare coordinates string: start;stop1;stop2...
      // Optimization API v1 max 12 stops.
      const stopsToOptimize = pendingStops.slice(0, 11); // 1 start + 11 stops = 12
      const coordinates = [
        `${currentLongitude},${currentLatitude}`,
        ...stopsToOptimize.map(s => `${s.longitude},${s.latitude}`)
      ].join(';');

      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${coordinates}?overview=full&geometries=geojson&access_token=${token}`;
      
      console.log(`[Optimization] Calling Mapbox API: ${url.replace(token, 'REDACTED')}`);
      
      const response = await fetch(url);
      const data = await response.json();

      console.log(`[Optimization] Mapbox Response Code: ${data.code}`);
      if (data.code !== 'Ok') {
        console.error(`[Optimization] Mapbox Error Detail: ${JSON.stringify(data)}`);
        throw new Error(`Mapbox Error: ${data.code}`);
      }

      // Log full response for debugging
      console.log(`[Optimization] Mapbox Response: ${JSON.stringify(data)}`);

      const trips = data.trips;
      if (!trips || trips.length === 0) {
        console.error(`[Optimization] No trips in response: ${JSON.stringify(data)}`);
        throw new Error("Nenhuma rota encontrada pela API do Mapbox");
      }

      // Mapbox Optimization v1 sometimes returns waypoint_indices directly in the first trip
      let optimizationOrder = trips[0].waypoint_indices;
      
      // If waypoint_indices is not in the trip, it might be in the root waypoints object
      if (!optimizationOrder && data.waypoints) {
        console.log("[Optimization] Reconstructing order from root waypoints");
        optimizationOrder = data.waypoints.map((_: any, i: number) => i);
      }

      // Final fallback: if we have waypoints but no order, use the order of waypoints
      if (!optimizationOrder && data.waypoints) {
        optimizationOrder = Array.from({ length: data.waypoints.length }, (_, i) => i);
      }

      if (!optimizationOrder) {
        // Log keys to identify where the data is
        console.error(`[Optimization] Missing waypoint_indices. Data keys: ${Object.keys(data)}`);
        if (data.waypoints && data.waypoints.length > 0) {
            console.log("[Optimization] Using waypoints order as emergency fallback");
            optimizationOrder = data.waypoints.map((_: any, i: number) => i);
        }
      }

      if (!optimizationOrder) {
        throw new Error("Dados de otimização (waypoint_indices) ausentes na resposta do Mapbox");
      }
      
      console.log(`[Optimization] Final Order: ${optimizationOrder}`);
      // optimizationOrder[0] is always 0 (the start point)
      // The rest are indices of the stopsToOptimize array + 1
      
      // 2. Update sequenceOrder in database
      // waypoint_indices mapping: index 0 is our current position
      // index 1..N are our stops
      const updates = [];
      for (let i = 1; i < optimizationOrder.length; i++) {
        const stopIndex = optimizationOrder[i] - 1;
        const stop = stopsToOptimize[stopIndex];
        // New sequence order starts after any already completed stops
        const completedCount = currentStops.length - pendingStops.length;
        updates.push(storage.updateStopSequence(stop.id, completedCount + i));
      }

      await Promise.all(updates);

      // 3. Return updated list and geometry
      const updatedStops = await storage.getStopsByItinerary(itineraryId);
      res.json({ 
        stops: updatedStops,
        geometry: data.trips[0].geometry
      });
    } catch (error: any) {
      console.error("Optimization failed:", error);
      res.status(500).json({ message: "Falha na otimização: " + error.message });
    }
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
