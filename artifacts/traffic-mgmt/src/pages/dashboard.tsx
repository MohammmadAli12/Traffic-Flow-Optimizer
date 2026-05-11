import { useGetStats, getGetStatsQueryKey, useListSignals, getListSignalsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Car, MapPin, Navigation, Signal } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { useEffect } from "react";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: signalsData, isLoading: signalsLoading } = useListSignals();

  const signals = Array.isArray(signalsData)
    ? signalsData
    : signalsData?.data || [];

  useEffect(() => {
    console.log('Dashboard - signalsData:', signalsData);
    console.log('Dashboard - signals array:', signals);
    console.log('Dashboard - stats:', stats);
  }, [signalsData, signals, stats]);

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
      {/* 3D Text Background Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative h-64 md:h-80 rounded-2xl overflow-hidden group"
        style={{
          perspective: "1200px",
        }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://www.easeindiatrip.com/images/up-img/rumi-darwaza.jpg')",
            filter: "brightness(0.3) blur(2px)",
          }}
        />

        {/* Animated Background Grid */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, 0.05) 25%, rgba(59, 130, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.05) 75%, rgba(59, 130, 246, 0.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, 0.05) 25%, rgba(59, 130, 246, 0.05) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, 0.05) 75%, rgba(59, 130, 246, 0.05) 76%, transparent 77%, transparent)",
            backgroundSize: "50px 50px",
          }}
          animate={{
            backgroundPosition: ["0px 0px", "50px 50px"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "loop",
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70" />

        {/* 3D Text Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
          {/* Main Title - LUCKNOW */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{
              transformStyle: "preserve-3d",
            }}
            whileHover={{
              rotateX: 10,
              rotateY: -10,
              scale: 1.05,
            }}
            className="cursor-pointer"
          >
            <motion.h1
              className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 uppercase tracking-tighter drop-shadow-2xl"
              animate={{
                textShadow: [
                  "0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                  "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(168, 85, 247, 0.4)",
                  "0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
            >
              LUCKNOW
            </motion.h1>
          </motion.div>

          {/* Subtitle - City of Nawab */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-4"
          >
            <motion.p
              className="text-lg md:text-2xl font-bold text-cyan-300 uppercase tracking-widest"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              City of Nawab
            </motion.p>
          </motion.div>

          {/* Decorative Elements */}
          <motion.div
            className="mt-6 flex gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: 0.3,
                repeat: Infinity,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                delay: 0.6,
                repeat: Infinity,
              }}
            />
          </motion.div>
        </div>

        {/* Floating Particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card className="bg-card border-card-border cursor-help hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total Cars</CardTitle>
                    <Car className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{stats?.totalCars || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all roads</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>Total number of vehicles detected across the entire traffic network</TooltipContent>
          </Tooltip>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card className="bg-card border-card-border cursor-help hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Intersections</CardTitle>
                    <MapPin className="h-4 w-4 text-chart-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{stats?.totalIntersections || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active nodes</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>Number of active traffic signal intersections in the system</TooltipContent>
          </Tooltip>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card className="bg-card border-card-border cursor-help hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Active Ambulances</CardTitle>
                    <Activity className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold font-mono">{stats?.activeAmbulances || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">In transit</p>
                  </CardContent>
                </Card>
              </div>
            </TooltipTrigger>
            <TooltipContent>Emergency vehicles currently in transit with priority routing</TooltipContent>
          </Tooltip>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Card className="bg-card border-card-border cursor-help hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105">
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
              </div>
            </TooltipTrigger>
            <TooltipContent>Road segment with the highest vehicle concentration</TooltipContent>
          </Tooltip>
        </motion.div>
      </div>

      {/* Live Signal Grid */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
          <Signal className="h-5 w-5" /> Live Signal Grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {signals.length > 0 ? (
            signals.map((signal) => (
              <Tooltip key={signal.id}>
                <TooltipTrigger asChild>
                  <div>
                    <Link href={`/intersections/${signal.intersectionId}`}>
                      <Card className="bg-card border-card-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-sm truncate flex-1">
                              {signal.roadName}
                            </div>
                            <Badge variant="outline" className="font-mono bg-background ml-2 shrink-0">
                              {signal.direction}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
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
                    </Link>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-semibold">{signal.roadName}</p>
                    <p>Direction: {signal.direction}</p>
                    <p>Current State: {signal.state.toUpperCase()}</p>
                    <p>Vehicles: {signal.carCount}</p>
                    <p className="text-xs text-muted-foreground mt-2">Click to view details</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card/50">
              No active signals detected. Add intersections and roads to begin.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
