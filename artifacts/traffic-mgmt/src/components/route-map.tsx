import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface RouteSegment {
  roadId: number;
  roadName: string;
  direction: string;
  carCount: number;
  intersectionName: string;
  isAmbulanceRoute?: boolean;
}

interface Hospital {
  id: number;
  name: string;
  location: string;
}

interface RouteMapProps {
  route: RouteSegment[];
  totalCars: number;
  nearestHospital: Hospital;
  sourceRoadName: string;
}

function trafficColor(carCount: number): string {
  if (carCount === 0) return "#10b981";   // green — clear
  if (carCount <= 4) return "#84cc16";    // lime — light
  if (carCount <= 8) return "#eab308";    // yellow — moderate
  if (carCount <= 12) return "#f97316";   // orange — heavy
  return "#ef4444";                       // red — congested
}

function trafficLabel(carCount: number): string {
  if (carCount === 0) return "CLEAR";
  if (carCount <= 4) return "LIGHT";
  if (carCount <= 8) return "MODERATE";
  if (carCount <= 12) return "HEAVY";
  return "CONGESTED";
}

export function RouteMap({ route, totalCars, nearestHospital, sourceRoadName }: RouteMapProps) {
  const [animStep, setAnimStep] = useState(0);

  // Mark all route segments as ambulance route
  const markedRoute = route.map((seg) => ({ ...seg, isAmbulanceRoute: true }));

  // Animate the ambulance along route steps
  useEffect(() => {
    setAnimStep(0);
    const interval = setInterval(() => {
      setAnimStep((prev) => {
        if (prev >= markedRoute.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [markedRoute.length]);

  if (!markedRoute || markedRoute.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        No route data available.
      </div>
    );
  }

  // Build nodes: origin + each unique intersection on route + hospital
  const nodes = [
    { label: sourceRoadName, sublabel: "ORIGIN", type: "origin" as const },
    ...markedRoute.slice(1).map((seg, i) => ({
      label: seg.intersectionName,
      sublabel: `via ${seg.direction}`,
      type: "intersection" as const,
      segment: seg,
    })),
    { label: nearestHospital.name, sublabel: nearestHospital.location, type: "hospital" as const },
  ];

  const edges = markedRoute.map((seg, i) => ({
    segment: seg,
    fromIdx: i,
    toIdx: i + 1,
  }));

  return (
    <div className="space-y-4">
      {/* Route header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Route Map</span>
        <span className="text-xs font-mono text-muted-foreground">
          Total traffic load:{" "}
          <span style={{ color: trafficColor(totalCars) }} className="font-bold">
            {totalCars} cars
          </span>
        </span>
      </div>

      {/* SVG route diagram */}
      <div className="bg-zinc-950 border border-border rounded-lg p-4 overflow-x-auto">
        <div className="min-w-[420px]">
          {/* Nodes row */}
          <div className="flex items-center justify-between gap-0">
            {nodes.map((node, i) => (
              <div key={i} className="flex flex-col items-center gap-1" style={{ minWidth: 80, maxWidth: 120 }}>
                {/* Node circle */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={animStep > i ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0.3 }}
                  transition={{ duration: 0.35, delay: 0 }}
                  className="relative"
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      node.type === "hospital"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-400"
                        : node.type === "origin"
                        ? "bg-red-950 border-red-500 text-red-400"
                        : "bg-zinc-800 border-zinc-500 text-zinc-300"
                    }`}
                  >
                    {node.type === "hospital" ? "H" : node.type === "origin" ? "A" : i}
                  </div>
                  {/* Pulse on origin when animating */}
                  {i === 0 && animStep <= markedRoute.length && (
                    <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-40" />
                  )}
                </motion.div>

                {/* Labels */}
                <div className="text-center">
                  <div
                    className={`text-[9px] font-bold uppercase tracking-wider ${
                      node.type === "hospital"
                        ? "text-emerald-400"
                        : node.type === "origin"
                        ? "text-red-400"
                        : "text-zinc-300"
                    }`}
                    style={{ maxWidth: 90, wordBreak: "break-word" }}
                  >
                    {node.label}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase">{node.sublabel}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Edges between nodes */}
          <div className="flex items-start px-10 -mt-[52px] mb-[52px] pointer-events-none">
            {edges.map((edge, i) => {
              const color = trafficColor(edge.segment.carCount);
              const active = animStep > i;
              return (
                <div key={i} className="flex-1 flex flex-col items-center" style={{ marginTop: 20 }}>
                  {/* Animated connector line */}
                  <div className="relative w-full h-3 flex items-center">
                    {/* Background track */}
                    <div className="w-full h-0.5 bg-zinc-800 rounded" />
                    {/* Ambulance route highlight */}
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded origin-left bg-gradient-to-r from-red-500 via-red-400 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
                      initial={{ scaleX: 0 }}
                      animate={active ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    {/* Animated fill */}
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 rounded origin-left"
                      style={{ backgroundColor: color }}
                      initial={{ scaleX: 0 }}
                      animate={active ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    {/* Moving ambulance dot */}
                    {animStep === i + 1 && (
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                        initial={{ left: "0%" }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.65, ease: "easeInOut" }}
                      />
                    )}
                  </div>
                  {/* Traffic label under edge */}
                  {active && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[8px] font-bold uppercase mt-0.5"
                      style={{ color }}
                    >
                      {trafficLabel(edge.segment.carCount)}
                    </motion.span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] font-mono">
        {[
          { label: "CLEAR", color: "#10b981" },
          { label: "LIGHT", color: "#84cc16" },
          { label: "MODERATE", color: "#eab308" },
          { label: "HEAVY", color: "#f97316" },
          { label: "CONGESTED", color: "#ef4444" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Segment table */}
      <div className="space-y-1">
        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2">Segment Details</div>
        {markedRoute.map((seg, i) => (
          <motion.div
            key={seg.roadId}
            initial={{ opacity: 0, x: -10 }}
            animate={animStep > i ? { opacity: 1, x: 0 } : { opacity: 0.3, x: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: trafficColor(seg.carCount) }} />
              <span className="text-zinc-300 font-bold">{seg.roadName}</span>
              <span className="text-zinc-500">{seg.direction}</span>
              <span className="text-zinc-600">{seg.intersectionName}</span>
              {seg.isAmbulanceRoute && (
                <span className="ml-2 px-2 py-0.5 bg-red-950 border border-red-500 rounded text-[9px] font-bold text-red-400 uppercase tracking-wider">
                  🚑 Route
                </span>
              )}
            </div>
            <span style={{ color: trafficColor(seg.carCount) }} className="font-bold">
              {seg.carCount} cars
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
