import { useActiveItinerary, useCreateItinerary, useItineraries } from "@/hooks/use-itineraries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Map, Plus, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { LayoutShell } from "@/components/layout-shell";
import { useAuth } from "@/hooks/use-auth";

export default function PlanPage() {
  const { data: activeItinerary, isLoading: isLoadingActive } = useActiveItinerary();
  const { data: itineraries, isLoading: isLoadingList } = useItineraries();
  const { mutate: createItinerary, isPending: isCreating } = useCreateItinerary();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleCreate = () => {
    createItinerary({ date: new Date().toISOString() });
  };

  const handleResume = () => {
    if (activeItinerary) {
      setLocation(`/app/drive`);
    }
  };

  if (isLoadingActive || isLoadingList) {
    return (
      <LayoutShell>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-display font-bold">Hello, {user?.firstName || 'Driver'}</h1>
          <p className="text-muted-foreground">Ready for today's route?</p>
        </div>

        {/* Active Route Card */}
        {activeItinerary ? (
          <Card className="border-l-4 border-l-primary shadow-md overflow-hidden bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Map className="w-5 h-5" />
                Active Route
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-2xl font-bold font-display">{format(new Date(activeItinerary.date), "MMMM d, yyyy")}</p>
                <p className="text-sm text-muted-foreground">Status: <span className="font-medium text-foreground uppercase">{activeItinerary.status}</span></p>
              </div>
              <Button onClick={handleResume} size="lg" className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                Resume Drive <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No active route today</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">Start a new itinerary to begin adding stops and tracking earnings.</p>
              <Button onClick={handleCreate} disabled={isCreating} size="lg" className="w-full sm:w-auto px-8 h-12">
                {isCreating ? <Loader2 className="animate-spin" /> : <><Plus className="mr-2 w-5 h-5" /> Start New Day</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* History List */}
        <div>
          <h2 className="text-xl font-bold mb-4 font-display">Recent History</h2>
          <div className="space-y-3">
            {itineraries && itineraries.length > 0 ? (
              itineraries.map((itinerary) => (
                <div key={itinerary.id} className="group bg-card border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors shadow-sm">
                  <div>
                    <p className="font-semibold">{format(new Date(itinerary.date), "EEE, MMM d")}</p>
                    <p className="text-sm text-muted-foreground">
                      Earnings: <span className="text-green-600 font-medium">R$ {itinerary.totalEarnings}</span>
                    </p>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm gap-2">
                    <span className={itinerary.status === 'completed' ? 'text-green-600' : 'text-blue-600'}>
                      {itinerary.status === 'completed' ? 'Done' : 'Active'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-border group-hover:text-foreground" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8 bg-muted/20 rounded-lg">No past itineraries found.</p>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
