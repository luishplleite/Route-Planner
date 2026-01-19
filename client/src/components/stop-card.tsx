import { Stop } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StopCardProps {
  stop: Stop;
  onUpdateStatus: (id: string, status: "delivered" | "failed" | "pending") => void;
  isNext?: boolean;
}

export function StopCard({ stop, onUpdateStatus, isNext = false }: StopCardProps) {
  const isCompleted = stop.status === "delivered";
  const isFailed = stop.status === "failed";
  const isPending = stop.status === "pending" || stop.status === "current";

  const statusColors = {
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    current: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
  };

  const handleNavigate = () => {
    // Open Waze or Google Maps (mobile only generally works best with this protocol)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      isNext && "border-2 border-primary shadow-lg ring-4 ring-primary/5 relative",
      !isNext && "border border-border/60 shadow-sm"
    )}>
      {isNext && (
        <div className="bg-primary text-white text-xs font-bold uppercase tracking-wider py-1 px-3 absolute top-0 right-0 rounded-bl-lg z-10">
          Next Stop
        </div>
      )}
      
      <CardContent className="p-0">
        <div className="flex flex-col">
          {/* Header Section */}
          <div className="p-4 flex gap-4 items-start">
            <div className={cn(
              "flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center border-2 font-display text-2xl font-bold text-shadow-sm",
              isCompleted ? "bg-green-500 border-green-600 text-white" :
              isFailed ? "bg-red-500 border-red-600 text-white" :
              "bg-primary text-white border-blue-600"
            )}>
              {stop.fixedIdentifier || stop.sequenceOrder}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight mb-1 text-foreground line-clamp-2">
                {stop.addressFull}
              </h3>
              {stop.notes && (
                <p className="text-sm text-muted-foreground italic truncate">
                  "{stop.notes}"
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn("capitalize font-medium", statusColors[stop.status as keyof typeof statusColors])}>
                  {stop.status}
                </Badge>
                {stop.deliveryTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(stop.deliveryTime), "HH:mm")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar - Only show for active/pending items */}
          {isPending && (
            <div className="grid grid-cols-3 divide-x divide-border border-t bg-muted/30">
              <button
                onClick={handleNavigate}
                className="flex flex-col items-center justify-center py-3 px-2 hover:bg-muted/50 active:bg-muted transition-colors group"
              >
                <Navigation className="h-5 w-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-blue-700">NAVIGATE</span>
              </button>
              
              <button
                onClick={() => onUpdateStatus(stop.id, "failed")}
                className="flex flex-col items-center justify-center py-3 px-2 hover:bg-red-50 active:bg-red-100 transition-colors group"
              >
                <X className="h-5 w-5 text-red-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-red-700">FAILED</span>
              </button>

              <button
                onClick={() => onUpdateStatus(stop.id, "delivered")}
                className="flex flex-col items-center justify-center py-3 px-2 hover:bg-green-50 active:bg-green-100 transition-colors group"
              >
                <Check className="h-5 w-5 text-green-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-green-700">DELIVERED</span>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
