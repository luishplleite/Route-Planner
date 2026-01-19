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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Fallback if env not set
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || (window as any).VITE_MAPBOX_TOKEN || "";

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
  const [showOptimizeDialog, setShowOptimizeDialog] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);

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
          <p>Carregando sua rota...</p>
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
          <h2 className="text-2xl font-bold">Nenhuma Rota Ativa</h2>
          <p className="text-muted-foreground max-w-xs">Você precisa iniciar uma rota na aba Planejar antes de poder dirigir.</p>
          <Button asChild className="mt-4">
            <a href="/app/plan">Ir para Planejar</a>
          </Button>
        </div>
      </LayoutShell>
    );
  }

  const stops = itinerary?.stops || [];
  const pendingStops = stops.filter(s => s.status === 'pending' || s.status === 'current').sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const nextStop = pendingStops[0];
  const otherStops = pendingStops.slice(1);

  const handleAddressSubmit = (address: string, coordinates?: [number, number]) => {
    if (coordinates) {
      addStop({
        addressFull: address,
        latitude: coordinates[1],
        longitude: coordinates[0],
        fixedIdentifier: String(stops.length + 1),
        notes: "Busca Mapbox"
      });
    } else {
      const lat = viewState.latitude + (Math.random() - 0.5) * 0.02;
      const lng = viewState.longitude + (Math.random() - 0.5) * 0.02;
      addStop({
        addressFull: address,
        latitude: lat,
        longitude: lng,
        fixedIdentifier: String(stops.length + 1),
        notes: "Entrada manual"
      });
    }
  };

  const handleOptimize = () => {
    if (!userLocation) {
      toast({ title: "Localização necessária", description: "Por favor, habilite a localização para otimizar a rota a partir da sua posição atual.", variant: "destructive" });
      return;
    }
    setShowOptimizeDialog(true);
  };

  const confirmOptimize = () => {
    if (!userLocation) return;
    console.log("[DrivePage] Optimizing with location:", userLocation);
    
    // Register current location as a log point or similar if needed
    // For now, optimization uses it as starting point.
    
    optimize(
      { currentLatitude: userLocation.lat, currentLongitude: userLocation.lng },
      {
        onSuccess: (data: any) => {
          console.log("[DrivePage] Optimization success data:", data);
          
          // data now has { stops, geometry } according to new route schema
          const geometry = data.geometry;
          
          if (geometry) {
            console.log("[DrivePage] Setting route geometry:", geometry);
            setRouteData({
              type: 'Feature',
              properties: {},
              geometry: geometry
            });
          } else if (data.trips && data.trips[0] && data.trips[0].geometry) {
            console.log("[DrivePage] Setting route geometry from trips fallback");
            setRouteData({
              type: 'Feature',
              properties: {},
              geometry: data.trips[0].geometry
            });
          } else {
            console.warn("[DrivePage] No geometry returned from optimization. Data keys:", Object.keys(data));
          }

          // Show detailed optimization summary in a toast or dialog
          if (data.stops && data.stops.length > 0) {
            const sequence = data.stops
              .sort((a: any, b: any) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
              .map((s: any) => `📦 ${s.fixedIdentifier} (Para ${s.sequenceOrder})`)
              .join('\n');
            
            toast({ 
              title: "Rota Otimizada", 
              description: (
                <div className="mt-2 text-xs space-y-1">
                  <p className="font-bold border-b pb-1 mb-1">Nova Sequência:</p>
                  {data.stops
                    .sort((a: any, b: any) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
                    .map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center py-0.5 border-b border-white/10 last:border-0">
                        <span className="font-semibold text-blue-400">#{s.sequenceOrder}</span>
                        <span className="flex-1 px-2 truncate">ID: {s.fixedIdentifier}</span>
                        <span className="text-[10px] opacity-70">Pendente</span>
                      </div>
                    ))
                  }
                </div>
              ),
              duration: 10000 
            });
          } else {
            toast({ title: "Rota Otimizada", description: "As paradas foram reordenadas para a rota mais rápida." });
          }
        },
        onError: (error: any) => {
          console.error("[DrivePage] Optimization error:", error);
          toast({ title: "Erro na Otimização", description: error.message || "Ocorreu um erro ao otimizar a rota.", variant: "destructive" });
        }
      }
    );
    setShowOptimizeDialog(false);
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
              
              {/* Route Line */}
              {routeData && (
                <Source id="route-source" type="geojson" data={routeData}>
                  <Layer
                    id="route-layer"
                    type="line"
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{ 
                      'line-color': '#3b82f6', 
                      'line-width': 5, 
                      'line-opacity': 0.8 
                    }}
                  />
                </Source>
              )}

              {/* Stops Markers */}
              {stops.map((stop) => (
                <Marker key={stop.id} longitude={Number(stop.longitude)} latitude={Number(stop.latitude)} anchor="bottom">
                  <div className="relative group">
                    <div className={`
                      h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md
                      ${stop.status === 'delivered' ? 'bg-green-500' : stop.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'}
                    `}>
                      {stop.sequenceOrder}
                    </div>
                    {/* Fixed identifier (Package ID) badge */}
                    <div className="absolute -top-2 -right-2 bg-slate-800 text-[10px] text-white px-1 rounded border border-white min-w-[16px] h-[16px] flex items-center justify-center text-center font-medium shadow-sm">
                      {stop.fixedIdentifier}
                    </div>
                  </div>
                </Marker>
              ))}
            </ReactMapGL>
          ) : (
            <div className="flex items-center justify-center h-full bg-slate-100 text-slate-400">
              <p className="flex items-center gap-2"><MapPin /> Token do Mapbox Ausente</p>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="absolute bottom-4 right-4 shadow-lg bg-white text-primary hover:bg-slate-50"
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Route className="w-4 h-4 mr-2" /> Otimizar</>}
          </Button>
        </div>

        <AlertDialog open={showOptimizeDialog} onOpenChange={setShowOptimizeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Otimizar Rota?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá reorganizar as paradas pendentes para encontrar o caminho mais rápido a partir da sua localização atual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmOptimize}>Otimizar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Input Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Adicionar Parada</h3>
          <VoiceAddressInput onAddressSubmit={handleAddressSubmit} disabled={isAdding} />
        </div>

        {/* Next Stop Highlight */}
        {nextStop && (
          <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-500">
             <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground text-primary">Próxima Parada</h3>
             <StopCard 
               stop={nextStop} 
               onUpdateStatus={(id, status) => updateStatus({ id, status, itineraryId: itinerary!.id })} 
               isNext={true}
             />
          </div>
        )}

        {/* Remaining List */}
        <div className="space-y-3 pb-10">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Fila ({otherStops.length})</h3>
          {otherStops.length > 0 ? (
            otherStops.map(stop => (
              <StopCard 
                key={stop.id} 
                stop={stop} 
                onUpdateStatus={(id, status) => updateStatus({ id, status, itineraryId: itinerary!.id })} 
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">Nenhuma outra parada pendente.</p>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
