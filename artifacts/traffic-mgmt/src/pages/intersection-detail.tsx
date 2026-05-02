import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetIntersection,
  getGetIntersectionQueryKey,
  useCreateRoad,
  useDeleteRoad,
  useUpdateCarCount,
  useComputeSignals,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ChevronLeft, Plus, Trash2, ArrowUpRight, Minus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { CreateRoadBodyDirection } from "@workspace/api-client-react/src/generated/api.schemas";

export function IntersectionDetail() {
  const { id } = useParams<{ id: string }>();
  const intersectionId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: intersection, isLoading } = useGetIntersection(intersectionId, {
    query: { enabled: !!intersectionId, queryKey: getGetIntersectionQueryKey(intersectionId) },
  });

  const createRoad = useCreateRoad();
  const deleteRoad = useDeleteRoad();
  const updateCarCount = useUpdateCarCount();
  const computeSignals = useComputeSignals();

  const [newRoadName, setNewRoadName] = useState("");
  const [newRoadDirection, setNewRoadDirection] = useState<CreateRoadBodyDirection>("North");
  const [isAddingRoad, setIsAddingRoad] = useState(false);

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: getGetIntersectionQueryKey(intersectionId) });
  };

  const handleCreateRoad = () => {
    if (!newRoadName) return;
    createRoad.mutate(
      { data: { intersectionId, name: newRoadName, direction: newRoadDirection } },
      {
        onSuccess: () => {
          setNewRoadName("");
          setIsAddingRoad(false);
          invalidateData();
          computeSignals.mutate({}, { onSuccess: invalidateData });
        },
      }
    );
  };

  const handleDeleteRoad = (roadId: number) => {
    deleteRoad.mutate({ id: roadId }, {
      onSuccess: () => {
        invalidateData();
        computeSignals.mutate({}, { onSuccess: invalidateData });
      }
    });
  };

  const handleUpdateCars = (roadId: number, currentCars: number, delta: number) => {
    const newCount = Math.max(0, currentCars + delta);
    updateCarCount.mutate(
      { id: roadId, data: { carCount: newCount } },
      {
        onSuccess: () => {
          invalidateData();
          computeSignals.mutate({}, { onSuccess: invalidateData });
        }
      }
    );
  };

  const handleForceCompute = () => {
    computeSignals.mutate({}, { onSuccess: invalidateData });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!intersection) {
    return <div>Intersection not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="h-8 w-8 bg-background">
            <Link href="/intersections">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              {intersection.name}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">{intersection.location}</p>
          </div>
        </div>
        <Button variant="secondary" onClick={handleForceCompute} disabled={computeSignals.isPending} className="uppercase text-xs font-bold tracking-wider">
          <RefreshCw className={`h-4 w-4 mr-2 ${computeSignals.isPending ? 'animate-spin' : ''}`} />
          Sync Grid
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Signal Feeds</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intersection.roads.length === 0 ? (
              <div className="col-span-full p-8 border border-dashed border-border rounded text-center text-muted-foreground">
                No roads connected. Add roads to establish signal control.
              </div>
            ) : (
              intersection.roads.map((road) => {
                const signal = intersection.signals.find((s) => s.roadId === road.id);
                return (
                  <motion.div key={road.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className="bg-card border-card-border overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-secondary/20 border-b border-border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-background font-mono">{road.direction}</Badge>
                          <span className="font-bold text-sm">{road.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRoad(road.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex flex-col items-center p-3 bg-background border border-border rounded gap-2">
                            <div className={`w-6 h-6 rounded-full transition-all duration-300 ${signal?.state === 'red' ? 'bg-destructive shadow-[0_0_15px_rgba(220,38,38,0.8)]' : 'bg-destructive/10'}`} />
                            <div className={`w-6 h-6 rounded-full transition-all duration-300 ${signal?.state === 'yellow' ? 'bg-chart-3 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : 'bg-chart-3/10'}`} />
                            <div className={`w-6 h-6 rounded-full transition-all duration-300 ${signal?.state === 'green' ? 'bg-chart-1 shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'bg-chart-1/10'}`} />
                          </div>
                          <div className="text-right font-mono text-sm space-y-1">
                            <div className="text-chart-1">Green: {signal?.greenDuration || 0}s</div>
                            <div className="text-destructive">Red: {signal?.redDuration || 0}s</div>
                            <div className="text-muted-foreground mt-2 border-t border-border pt-2 text-xs">Updated: {signal ? new Date(signal.updatedAt).toLocaleTimeString() : 'N/A'}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-secondary/30 p-2 rounded">
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                            <Car className="h-4 w-4 text-primary" /> Traffic Load
                          </div>
                          <div className="flex items-center gap-3">
                            <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-background" onClick={() => handleUpdateCars(road.id, road.carCount, -1)} disabled={road.carCount <= 0 || updateCarCount.isPending}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-mono font-bold text-lg min-w-[2ch] text-center">{road.carCount}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6 rounded-full bg-background" onClick={() => handleUpdateCars(road.id, road.carCount, 1)} disabled={updateCarCount.isPending}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Add Connection</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Road Name</Label>
                <Input value={newRoadName} onChange={(e) => setNewRoadName(e.target.value)} placeholder="e.g. 1st Avenue North" className="font-mono text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Direction</Label>
                <Select value={newRoadDirection} onValueChange={(val: CreateRoadBodyDirection) => setNewRoadDirection(val)}>
                  <SelectTrigger className="font-mono text-sm">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North">North</SelectItem>
                    <SelectItem value="South">South</SelectItem>
                    <SelectItem value="East">East</SelectItem>
                    <SelectItem value="West">West</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateRoad} disabled={!newRoadName || createRoad.isPending} className="w-full uppercase text-xs font-bold tracking-wide">
                <ArrowUpRight className="h-4 w-4 mr-2" /> Connect Road
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
