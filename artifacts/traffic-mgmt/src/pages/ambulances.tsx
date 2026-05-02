import { useState } from "react";
import {
  useListAmbulances,
  getListAmbulancesQueryKey,
  useListRoads,
  useDispatchAmbulance,
  useResolveAmbulance,
  useComputeSignals,
  useGetAmbulance,
  getGetAmbulanceQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Siren, MapPin, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { RouteMap } from "@/components/route-map";

// Sub-component that fetches route for a specific ambulance
function AmbulanceRoutePanel({ ambulanceId, onClose }: { ambulanceId: number; onClose: () => void }) {
  const { data, isLoading } = useGetAmbulance(ambulanceId, {
    query: { queryKey: getGetAmbulanceQueryKey(ambulanceId) },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4 bg-zinc-950 border border-border rounded-lg">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Map className="h-3.5 w-3.5" /> Route to {data.nearestHospital.name}
        </span>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase font-bold tracking-wider">
          Close
        </button>
      </div>
      <RouteMap
        route={data.route}
        totalCars={data.totalCars}
        nearestHospital={data.nearestHospital}
        sourceRoadName={data.ambulance.sourceRoadName}
      />
    </motion.div>
  );
}

export function Ambulances() {
  const queryClient = useQueryClient();
  const { data: ambulances, isLoading: loadingAmbulances } = useListAmbulances();
  const { data: roads } = useListRoads();
  const dispatchAmbulance = useDispatchAmbulance();
  const resolveAmbulance = useResolveAmbulance();
  const computeSignals = useComputeSignals();

  const [selectedRoadId, setSelectedRoadId] = useState<string>("");
  const [viewingRouteId, setViewingRouteId] = useState<number | null>(null);

  // Last dispatched route (shown immediately after dispatch)
  const [lastRoute, setLastRoute] = useState<{
    ambulanceId: number;
    route: { roadId: number; roadName: string; direction: string; carCount: number; intersectionName: string }[];
    totalCars: number;
    nearestHospital: { id: number; name: string; location: string };
    sourceRoadName: string;
  } | null>(null);

  const handleDispatch = () => {
    if (!selectedRoadId) return;
    dispatchAmbulance.mutate(
      { data: { sourceRoadId: parseInt(selectedRoadId, 10) } },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListAmbulancesQueryKey() });
          computeSignals.mutate({});
          setSelectedRoadId("");
          // Store route for immediate display
          setLastRoute({
            ambulanceId: result.ambulance.id,
            route: result.route,
            totalCars: result.totalCars,
            nearestHospital: result.nearestHospital,
            sourceRoadName: result.ambulance.sourceRoadName,
          });
          setViewingRouteId(result.ambulance.id);
        },
      }
    );
  };

  const handleResolve = (id: number) => {
    resolveAmbulance.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAmbulancesQueryKey() });
          computeSignals.mutate({});
          if (viewingRouteId === id) {
            setViewingRouteId(null);
            setLastRoute(null);
          }
        },
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Emergency Dispatch</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Route ambulances through the lowest-traffic paths to the nearest hospital
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatch panel */}
        <Card className="bg-card border-destructive/30 shadow-[0_0_20px_rgba(220,38,38,0.05)]">
          <CardHeader className="border-b border-border bg-secondary/20">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Siren className="h-4 w-4 text-destructive" /> Issue Dispatch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Origin Road</Label>
              <Select value={selectedRoadId} onValueChange={setSelectedRoadId}>
                <SelectTrigger className="font-mono text-sm border-input bg-background">
                  <SelectValue placeholder="Select emergency origin" />
                </SelectTrigger>
                <SelectContent>
                  {roads?.map((road) => (
                    <SelectItem key={road.id} value={road.id.toString()}>
                      {road.name} — {road.carCount} cars
                    </SelectItem>
                  ))}
                  {roads?.length === 0 && (
                    <div className="px-2 py-4 text-sm text-muted-foreground">No roads available.</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDispatch}
              disabled={!selectedRoadId || dispatchAmbulance.isPending}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground uppercase tracking-wider font-bold text-xs"
            >
              {dispatchAmbulance.isPending ? "Computing route..." : "Dispatch Ambulance"}
            </Button>

            {/* Hint */}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              The system finds the nearest hospital via the road with the fewest cars. Signal priority is given to the ambulance's route.
            </p>
          </CardContent>
        </Card>

        {/* Missions list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Missions</h2>

          {loadingAmbulances ? (
            <div className="space-y-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {ambulances?.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 border border-dashed border-border rounded-lg text-center text-muted-foreground bg-card/50 flex flex-col items-center"
                  >
                    <CheckCircle2 className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-sm uppercase tracking-widest font-bold">No Active Emergencies</p>
                  </motion.div>
                ) : (
                  ambulances?.map((amb) => (
                    <motion.div
                      key={amb.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-0"
                    >
                      <div
                        className={`relative overflow-hidden border rounded-lg p-4 bg-card ${
                          amb.status === "active"
                            ? "border-destructive/50 shadow-[0_0_15px_rgba(220,38,38,0.08)]"
                            : "border-border opacity-60"
                        }`}
                      >
                        {amb.status === "active" && (
                          <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                        )}

                        <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={amb.status === "active" ? "destructive" : "secondary"}
                                className="uppercase text-[10px] tracking-wider font-bold"
                              >
                                {amb.status}
                              </Badge>
                              <span className="font-mono text-xs text-muted-foreground">
                                AMB-{amb.id.toString().padStart(4, "0")}
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {new Date(amb.dispatchedAt).toLocaleTimeString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-sm font-mono flex-wrap">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-destructive" />
                                <span>{amb.sourceRoadName}</span>
                              </div>
                              <span className="text-zinc-600">→</span>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                                <Activity className="h-3.5 w-3.5" />
                                <span>{amb.targetHospitalName}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {amb.status === "active" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setViewingRouteId(viewingRouteId === amb.id ? null : amb.id)
                                  }
                                  className={`uppercase text-xs font-bold tracking-wider transition-colors ${
                                    viewingRouteId === amb.id
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : ""
                                  }`}
                                >
                                  <Map className="h-3.5 w-3.5 mr-1.5" />
                                  Route
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResolve(amb.id)}
                                  disabled={resolveAmbulance.isPending}
                                  className="uppercase text-xs font-bold tracking-wider hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-colors"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                  Resolve
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Route map panel inline below the ambulance card */}
                      <AnimatePresence>
                        {viewingRouteId === amb.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2">
                              {/* Use last dispatch result if available, otherwise fetch */}
                              {lastRoute && lastRoute.ambulanceId === amb.id ? (
                                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                                  <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                      <Map className="h-3.5 w-3.5" /> Route to {lastRoute.nearestHospital.name}
                                    </span>
                                    <button
                                      onClick={() => { setViewingRouteId(null); setLastRoute(null); }}
                                      className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase font-bold tracking-wider"
                                    >
                                      Close
                                    </button>
                                  </div>
                                  <RouteMap
                                    route={lastRoute.route}
                                    totalCars={lastRoute.totalCars}
                                    nearestHospital={lastRoute.nearestHospital}
                                    sourceRoadName={lastRoute.sourceRoadName}
                                  />
                                </div>
                              ) : (
                                <AmbulanceRoutePanel
                                  ambulanceId={amb.id}
                                  onClose={() => setViewingRouteId(null)}
                                />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
