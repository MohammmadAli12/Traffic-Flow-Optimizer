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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, ChevronLeft, Plus, Trash2, ArrowUpRight, Minus, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { LiveSignal } from "@/components/live-signal";

type Direction = "North" | "South" | "East" | "West";

export function IntersectionDetail() {
  const { id } = useParams<{ id: string }>();
  const intersectionId = parseInt(id || "0", 10);
  const queryClient = useQueryClient();

  const { data: intersection, isLoading, error } = useGetIntersection(intersectionId, {
    query: { enabled: intersectionId > 0, queryKey: getGetIntersectionQueryKey(intersectionId) },
  });

  const createRoad = useCreateRoad();
  const deleteRoad = useDeleteRoad();
  const updateCarCount = useUpdateCarCount();
  const computeSignals = useComputeSignals();

  const [newRoadName, setNewRoadName] = useState("");
  const [newRoadDirection, setNewRoadDirection] = useState<Direction>("North");

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (!intersection) {
    return <div className="text-muted-foreground p-8">Intersection not found. (ID: {intersectionId})</div>;
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
            <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">
              {intersection.name}
            </h1>
            <p className="text-sm text-muted-foreground font-mono">{intersection.location}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => computeSignals.mutate({}, { onSuccess: invalidateData })}
          disabled={computeSignals.isPending}
          className="uppercase text-xs font-bold tracking-wider"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${computeSignals.isPending ? "animate-spin" : ""}`} />
          Sync Grid
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal feeds */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Live Signal Feeds
            </h2>
            <span className="text-[10px] font-mono text-muted-foreground uppercase">
              {intersection.roads.length} road{intersection.roads.length !== 1 ? "s" : ""}
            </span>
          </div>

          {intersection.roads.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded text-center text-muted-foreground text-sm">
              No roads connected. Add roads to establish signal control.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {intersection.roads.map((road) => {
                const signal = intersection.signals.find((s) => s.roadId === road.id);
                return (
                  <motion.div key={road.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="space-y-2">
                      <LiveSignal
                        greenDuration={signal?.greenDuration ?? 30}
                        redDuration={signal?.redDuration ?? 60}
                        initialState={signal?.state ?? "red"}
                        roadName={road.name}
                        direction={road.direction}
                        carCount={road.carCount}
                      />

                      {/* Car count controls */}
                      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 rounded border border-border">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <Car className="h-3.5 w-3.5 text-primary" />
                          Traffic Load
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-background"
                            onClick={() => handleUpdateCars(road.id, road.carCount, -1)}
                            disabled={road.carCount <= 0 || updateCarCount.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-mono font-black text-xl min-w-[2ch] text-center tabular-nums">
                            {road.carCount}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full bg-background"
                            onClick={() => handleUpdateCars(road.id, road.carCount, 1)}
                            disabled={updateCarCount.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive ml-2"
                            onClick={() => handleDeleteRoad(road.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add road sidebar */}
        <div>
          <Card className="bg-card border-card-border">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Add Connection
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Road Name</Label>
                <Input
                  value={newRoadName}
                  onChange={(e) => setNewRoadName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoad()}
                  placeholder="e.g. 1st Avenue North"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Direction</Label>
                <Select value={newRoadDirection} onValueChange={(val: Direction) => setNewRoadDirection(val)}>
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
              <Button
                onClick={handleCreateRoad}
                disabled={!newRoadName || createRoad.isPending}
                className="w-full uppercase text-xs font-bold tracking-wide"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Connect Road
              </Button>
            </CardContent>
          </Card>

          {/* Signal explanation */}
          <div className="mt-4 p-4 bg-card border border-border rounded-lg space-y-2 text-xs text-muted-foreground">
            <p className="font-bold uppercase tracking-wider text-foreground text-[10px]">How signals work</p>
            <p>Roads with more cars get longer green phases. The busiest road turns green first. All signals cycle continuously.</p>
            <div className="flex flex-col gap-1 pt-1 font-mono">
              <span className="text-emerald-400">Green = most traffic gets right of way</span>
              <span className="text-yellow-400">Yellow = 3s transition</span>
              <span className="text-red-400">Red = proportional wait time</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
