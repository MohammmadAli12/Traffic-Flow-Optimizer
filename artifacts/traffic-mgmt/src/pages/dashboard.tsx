import { useGetStats, getGetStatsQueryKey, useListSignals, getListSignalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Car, MapPin, Navigation, Signal } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: signals, isLoading: signalsLoading } = useListSignals();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (statsLoading || signalsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground uppercase tracking-tight">System Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time status of traffic grid and operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Cars</CardTitle>
              <Car className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stats?.totalCars || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all roads</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Intersections</CardTitle>
              <MapPin className="h-4 w-4 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stats?.totalIntersections || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active nodes</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Ambulances</CardTitle>
              <Activity className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono">{stats?.activeAmbulances || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">In transit</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-card border-card-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Busiest Road</CardTitle>
              <Navigation className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">
                {stats?.busiestRoad ? stats.busiestRoad.name : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.busiestRoad ? `${stats.busiestRoad.carCount} cars detected` : "No traffic data"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
          <Signal className="h-5 w-5" /> Live Signal Grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals?.map((signal) => (
            <Card key={signal.id} className="bg-card border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-sm">
                    <Link href={`/intersections/${signal.intersectionId}`} className="hover:text-primary transition-colors">
                      {signal.intersectionName}
                    </Link>
                  </div>
                  <Badge variant="outline" className="font-mono bg-background">
                    {signal.direction}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    <span className="block mb-1">{signal.roadName}</span>
                    <span className="font-mono text-foreground">{signal.carCount} cars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1 bg-background p-1.5 rounded border border-border">
                      <div className={`w-3 h-3 rounded-full ${signal.state === 'red' ? 'bg-destructive shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-destructive/20'}`} />
                      <div className={`w-3 h-3 rounded-full ${signal.state === 'yellow' ? 'bg-chart-3 shadow-[0_0_8px_rgba(234,179,8,0.8)]' : 'bg-chart-3/20'}`} />
                      <div className={`w-3 h-3 rounded-full ${signal.state === 'green' ? 'bg-chart-1 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-chart-1/20'}`} />
                    </div>
                    <div className="font-mono text-xs flex flex-col gap-0.5 text-right">
                      <span className="text-chart-1">G: {signal.greenDuration}s</span>
                      <span className="text-destructive">R: {signal.redDuration}s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {signals?.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card/50">
              No active signals detected. Add intersections and roads to begin.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
