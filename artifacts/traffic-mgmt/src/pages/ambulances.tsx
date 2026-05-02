import { useState } from "react";
import {
  useListAmbulances,
  getListAmbulancesQueryKey,
  useListRoads,
  useDispatchAmbulance,
  useResolveAmbulance,
  useComputeSignals,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, Siren, Route as RouteIcon, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Ambulances() {
  const queryClient = useQueryClient();
  const { data: ambulances, isLoading: loadingAmbulances } = useListAmbulances();
  const { data: roads, isLoading: loadingRoads } = useListRoads();
  const dispatchAmbulance = useDispatchAmbulance();
  const resolveAmbulance = useResolveAmbulance();
  const computeSignals = useComputeSignals();

  const [selectedRoadId, setSelectedRoadId] = useState<string>("");

  const handleDispatch = () => {
    if (!selectedRoadId) return;
    dispatchAmbulance.mutate(
      { data: { sourceRoadId: parseInt(selectedRoadId, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAmbulancesQueryKey() });
          computeSignals.mutate({}, {
            onSuccess: () => {
              setSelectedRoadId("");
            }
          });
        }
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
        }
      }
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">Emergency Dispatch</h1>
        <p className="text-sm text-muted-foreground mt-1">Route ambulances through the lowest-traffic paths</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-destructive/30 shadow-[0_0_20px_rgba(220,38,38,0.05)] col-span-1">
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
                      {road.name} ({road.direction})
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
              {dispatchAmbulance.isPending ? "Routing..." : "Dispatch Ambulance"}
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Active Missions</h2>
          
          {loadingAmbulances ? (
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
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
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-3 opacity-50" />
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
                      className={`relative overflow-hidden border rounded-lg p-4 bg-card ${
                        amb.status === 'active' ? 'border-destructive/50 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 'border-border'
                      }`}
                    >
                      {amb.status === 'active' && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse" />
                      )}
                      
                      <div className="relative z-10 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Badge variant={amb.status === 'active' ? 'destructive' : 'secondary'} className="uppercase text-[10px] tracking-wider font-bold">
                              {amb.status}
                            </Badge>
                            <span className="font-mono text-xs text-muted-foreground">ID: AMB-{amb.id.toString().padStart(4, '0')}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm font-mono">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" /> {amb.sourceRoadName}
                            </div>
                            <RouteIcon className="h-4 w-4 text-primary opacity-50" />
                            <div className="flex items-center gap-2 text-foreground font-bold">
                              <Activity className="h-4 w-4 text-chart-1" /> {amb.targetHospitalName}
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Dispatched: {new Date(amb.dispatchedAt).toLocaleTimeString()}
                          </div>
                        </div>

                        {amb.status === 'active' && (
                          <div className="flex items-end sm:items-center">
                            <Button 
                              variant="outline" 
                              onClick={() => handleResolve(amb.id)}
                              disabled={resolveAmbulance.isPending}
                              className="uppercase text-xs font-bold tracking-wider hover:bg-chart-1 hover:text-white hover:border-chart-1 transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" /> Resolve
                            </Button>
                          </div>
                        )}
                      </div>
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
