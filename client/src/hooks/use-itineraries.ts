import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Itinerary, type Stop, type InsertStop, type CreateItineraryRequest, type UpdateStopStatusRequest, type OptimizeRouteRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useItineraries() {
  return useQuery({
    queryKey: [api.itineraries.list.path],
    queryFn: async () => {
      const res = await fetch(api.itineraries.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch itineraries");
      return api.itineraries.list.responses[200].parse(await res.json());
    },
  });
}

export function useActiveItinerary() {
  return useQuery({
    queryKey: [api.itineraries.getActive.path],
    queryFn: async () => {
      const res = await fetch(api.itineraries.getActive.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch active itinerary");
      return api.itineraries.getActive.responses[200].parse(await res.json());
    },
  });
}

export function useItinerary(id: string) {
  return useQuery({
    queryKey: [api.itineraries.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.itineraries.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch itinerary details");
      return api.itineraries.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateItinerary() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: CreateItineraryRequest) => {
      const res = await fetch(api.itineraries.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create itinerary");
      }
      return api.itineraries.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.itineraries.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.itineraries.getActive.path] });
      toast({ title: "Itinerary Created", description: "You're ready to start planning.", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });
}

export function useAddStop(itineraryId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertStop) => {
      // Note: Backend might ignore itineraryId in body if provided via URL param, 
      // but strict typing suggests adhering to InsertStop which doesn't include it if omitted in omit schema.
      // However, the request input is manually defined in routes.ts, let's match that.
      const url = buildUrl(api.stops.add.path, { id: itineraryId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add stop");
      return api.stops.add.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.itineraries.get.path, itineraryId] });
      toast({ title: "Stop Added", description: "Location added to your route." });
    },
    onError: (error) => {
      toast({ title: "Error adding stop", description: error.message, variant: "destructive" });
    }
  });
}

export function useUpdateStopStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status, itineraryId }: { id: string, status: UpdateStopStatusRequest['status'], itineraryId: string }) => {
      const url = buildUrl(api.stops.updateStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update status");
      return api.stops.updateStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, { itineraryId, status }) => {
      queryClient.invalidateQueries({ queryKey: [api.itineraries.get.path, itineraryId] });
      const message = status === 'delivered' ? "Delivery completed!" : 
                      status === 'failed' ? "Delivery marked as failed." : "Status updated.";
      toast({ 
        title: message, 
        variant: status === 'delivered' ? "default" : status === 'failed' ? "destructive" : "default",
        className: status === 'delivered' ? "bg-green-600 text-white border-green-700" : ""
      });
    },
  });
}

export function useOptimizeRoute(itineraryId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: OptimizeRouteRequest) => {
      const url = buildUrl(api.stops.optimize.path, { id: itineraryId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to optimize route");
      return api.stops.optimize.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.itineraries.get.path, itineraryId] });
      toast({ title: "Route Optimized", description: "Your stops have been reordered for efficiency." });
    },
  });
}

export function useFinanceSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [api.finance.getSummary.path, startDate, endDate],
    queryFn: async () => {
      // Need to construct query params manually since buildUrl only handles path params
      const params = new URLSearchParams({ startDate, endDate });
      const res = await fetch(`${api.finance.getSummary.path}?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch finance summary");
      return api.finance.getSummary.responses[200].parse(await res.json());
    }
  });
}
