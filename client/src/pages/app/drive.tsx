import { useEffect, useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useActiveItinerary, useItinerary, useAddStop, useUpdateStopStatus, useOptimizeRoute } from "@/hooks/use-itineraries";
import { VoiceAddressInput } from "@/components/voice-address-input";
import { StopCard } from "@/components/stop-card";
import { Button } from "@/components/ui/button";
import { Loader2, Route, MapPin, AlertTriangle } from "lucide-react";
import { Stop } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import ReactMapGL, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Fallback if env not set
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

export default function DrivePage() {
  const { data: activeMeta, isLoading: isLoadingMeta } = useActiveItinerary();
  // Fetch full details including stops if we have an ID
  const { data: itinerary, isLoading: isLoadingDetails } = useItinerary(activeMeta?.id || "");
  const { mutate: addStop, isPending: isAdding } = useAddStop(activeMeta?.id || "");
  const { mutate: updateStatus } = useUpdateStopStatus();
  const { mutate: optimize, isPending: isOptimizing } = useOptimizeRoute(activeMeta?.id || "");
  const { toast } = useToast();

  const [viewState, setViewState] = useState({
    latitude: -23.5505, // Default to Sao Paulo
    longitude: -46.6333,
    zoom: 12
  });

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setViewState(prev => ({ ...prev, latitude, longitude, zoom: 14 }));
        },
        (error) => console.error("Error getting location", error)
      );
    }
  }, []);

  if (isLoadingMeta || (activeMeta && isLoadingDetails)) {
    return (
      <LayoutShell>
        <div className="h-[80vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p>Loading your route...</p>
        </div>
      </LayoutShell>
    );
  }

  if (!activeMeta) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <div className="h-20 w-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">No Active Route</h2>
          <p className="text-muted-foreground max-w-xs">You need to start a route in the Plan tab before you can drive.</p>
          <Button asChild className="mt-4">
            <a href="/app/plan">Go to Plan</a>
          </Button>
        </div>
      </LayoutShell>
    );
  }

  const stops = itinerary?.stops || [];
  const pendingStops = stops.filter(s => s.status === 'pending' || s.status === 'current').sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nextStop = pendingStops[0];
  const otherStops = pendingStops.slice(1);

  // Mock geocoding for demo purposes since we don't have a backend geocoder
  const handleAddressSubmit = (address: string) => {
    // In a real app, backend would geocode. Here we simulate it near the user or map center.
    // We'll add some random offset to simulate different locations.
    const lat = viewState.latitude + (Math.random() - 0.5) * 0.02;
    const lng = viewState.longitude + (Math.random() - 0.5) * 0.02;
    
    addStop({
      addressFull: address, // In real app, this would come from geocoding result
      latitude: lat,
      longitude: lng,
      fixedIdentifier: String(stops.length + 1), // Simple auto-increment
      notes: "Voice entry"
    });
  };

  const handleOptimize = () => {
    if (!userLocation) {
      toast({ title: "Location required", description: "Please enable location to optimize route from your current position.", variant: "destructive" });
      return;
    }
    optimize({ currentLatitude: userLocation.lat, currentLongitude: userLocation.lng });
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Map Section */}
        <div className="h-[250px] md:h-[350px] w-full rounded-2xl overflow-hidden shadow-inner border relative bg-slate-100">
          {MAPBOX_TOKEN ? (
            <ReactMapGL
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
            >
              {/* User Location */}
              {userLocation && (
                <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                  <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                </Marker>
              )}
              
              {/* Stops Markers */}
              {stops.map((stop) => (
                <Marker key={stop.id} longitude={Number(stop.longitude)} latitude={Number(stop.latitude)} anchor="bottom">
                  <div className={`
                    h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-md
                    ${stop.status === 'delivered' ? 'bg-green-500' : stop.status === 'failed' ? 'bg-red-500' : 'bg-primary'}
                  `}>
                    {stop.fixedIdentifier}
                  </div>
                </Marker>
              ))}
            </ReactMapGL>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400">
              <p className="flex items-center gap-2"><MapPin /> Mapbox Token Missing</p>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="absolute bottom-4 right-4 shadow-lg bg-white text-primary hover:bg-slate-50"
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Route className="w-4 h-4 mr-2" /> Optimize</>}
          </Button>
        </div>

        {/* Input Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Add New Stop</h3>
          <VoiceAddressInput onAddressSubmit={handleAddressSubmit} disabled={isAdding} />
        </div>

        {/* Next Stop Highlight */}
        {nextStop && (
          <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
             <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground text-primary">Up Next</h3>
             <StopCard 
               stop={nextStop} 
               onUpdateStatus={(id, status) => updateStatus({ id, status, itineraryId: itinerary!.id })} 
               isNext={true}
             />
          </div>
        )}

        {/* Remaining List */}
        <div className="space-y-3 pb-10">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Queue ({otherStops.length})</h3>
          {otherStops.length > 0 ? (
            otherStops.map(stop => (
              <StopCard 
                key={stop.id} 
                stop={stop} 
                onUpdateStatus={(id, status) => updateStatus({ id, status, itineraryId: itinerary!.id })} 
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No other pending stops.</p>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
