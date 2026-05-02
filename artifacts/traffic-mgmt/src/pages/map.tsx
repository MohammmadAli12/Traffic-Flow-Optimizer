import { useEffect, useState, useCallback } from "react";
import {
  useListIntersections,
  useListHospitals,
  useListSignals,
  getListSignalsQueryKey,
  useDispatchAmbulance,
  useComputeSignals,
  useListRoads,
  getListAmbulancesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Siren, RefreshCw, Map as MapIcon, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Icon factories ────────────────────────────────────────────────────────────
function circleIcon(color: string, size = 28): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 14px ${color},0 2px 8px rgba(0,0,0,0.7);
      position:relative;
    "><div style="
      position:absolute;inset:0;border-radius:50%;
      background:${color};opacity:0.4;
      animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite;
      transform:scale(1.5);
    "></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function hospitalIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:32px;height:32px;border-radius:8px;
      background:#10b981;border:3px solid #fff;
      box-shadow:0 0 14px #10b981,0 2px 8px rgba(0,0,0,0.7);
      display:flex;align-items:center;justify-content:center;
      font-size:15px;font-weight:900;color:#fff;font-family:monospace;line-height:1;
    ">H</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function ambulanceIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:#dc2626;border:3px solid #fff;
      box-shadow:0 0 20px #dc2626,0 2px 10px rgba(0,0,0,0.8);
      display:flex;align-items:center;justify-content:center;
      font-size:18px;line-height:1;
    ">🚑</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function signalColor(state: string) {
  if (state === "green") return "#10b981";
  if (state === "yellow") return "#eab308";
  return "#ef4444";
}

function interpolate(route: [number, number][], t: number): [number, number] {
  if (route.length < 2) return route[0] ?? [26.8467, 80.9462];
  const segs = route.length - 1;
  const raw = Math.min(t * segs, segs - 0.001);
  const i = Math.floor(raw);
  const f = raw - i;
  const a = route[i], b = route[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

function FlyTo({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 12); }, []);
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface AmbSim {
  id: number;
  route: [number, number][];
  progress: number;
  sourceRoadName: string;
  hospitalName: string;
  totalCars: number;
  done: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function LucknowMap() {
  const qc = useQueryClient();
  const { data: intersections } = useListIntersections();
  const { data: hospitals } = useListHospitals();
  const { data: signals } = useListSignals();
  const { data: roads } = useListRoads();

  const dispatch = useDispatchAmbulance();
  const compute = useComputeSignals();

  const [selectedRoad, setSelectedRoad] = useState("");
  const [sims, setSims] = useState<AmbSim[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 9)]);
  }, []);

  // Tick ambulance animations forward
  useEffect(() => {
    const id = setInterval(() => {
      setSims(prev => prev.map(s => {
        if (s.done) return s;
        const next = s.progress + 0.006;
        if (next >= 1) {
          addLog(`AMB-${String(s.id).padStart(4, "0")} arrived at ${s.hospitalName}`);
          return { ...s, progress: 1, done: true };
        }
        return { ...s, progress: next };
      }));
    }, 80);
    return () => clearInterval(id);
  }, [addLog]);

  const getPos = useCallback((id: number): [number, number] | null => {
    const ix = intersections?.find(i => i.id === id);
    if (!ix) return null;
    const lat = (ix as unknown as { lat?: number }).lat;
    const lng = (ix as unknown as { lng?: number }).lng;
    if (lat == null || lng == null) return null;
    return [lat, lng];
  }, [intersections]);

  const intersectionSignal = useCallback((id: number) => {
    const sigs = signals?.filter(s => s.intersectionId === id) ?? [];
    return sigs.some(s => s.state === "green") ? "green" : "red";
  }, [signals]);

  const handleDispatch = () => {
    if (!selectedRoad) return;
    const roadId = parseInt(selectedRoad, 10);
    const road = roads?.find(r => r.id === roadId);

    dispatch.mutate({ data: { sourceRoadId: roadId } }, {
      onSuccess: result => {
        qc.invalidateQueries({ queryKey: getListAmbulancesQueryKey() });
        compute.mutate({}, { onSuccess: () => qc.invalidateQueries({ queryKey: getListSignalsQueryKey() }) });

        // Build coordinate path
        const coords: [number, number][] = [];

        // Origin intersection
        const srcPos = road?.intersectionId ? getPos(road.intersectionId) : null;
        if (srcPos) coords.push(srcPos);

        // Intermediate intersections from route segments
        for (const seg of result.route) {
          const segRoad = roads?.find(r => r.id === seg.roadId);
          if (segRoad) {
            const p = getPos(segRoad.intersectionId);
            if (p && JSON.stringify(coords[coords.length - 1]) !== JSON.stringify(p)) coords.push(p);
          }
        }

        // Hospital position
        const h = result.nearestHospital as unknown as { lat?: number; lng?: number; nearestIntersectionId: number; name: string };
        const hPos: [number, number] = (h.lat != null && h.lng != null)
          ? [h.lat, h.lng]
          : (getPos(h.nearestIntersectionId) ?? [26.8657, 80.9424]);

        if (JSON.stringify(coords[coords.length - 1]) !== JSON.stringify(hPos)) coords.push(hPos);

        // Ensure at least 2 points
        if (coords.length < 2 && srcPos) coords.push(hPos);

        const sim: AmbSim = {
          id: result.ambulance.id,
          route: coords.length >= 2 ? coords : [srcPos ?? [26.8467, 80.9462], hPos],
          progress: 0,
          sourceRoadName: result.ambulance.sourceRoadName,
          hospitalName: result.nearestHospital.name,
          totalCars: result.totalCars,
          done: false,
        };

        setSims(prev => [...prev.filter(s => s.id !== sim.id), sim]);
        addLog(`AMB-${String(sim.id).padStart(4, "0")} dispatched: ${sim.sourceRoadName} → ${sim.hospitalName} (${sim.totalCars} cars on route)`);
        setSelectedRoad("");
      },
      onError: () => addLog("Dispatch failed — add hospitals first"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <MapIcon className="h-6 w-6" /> Lucknow Traffic Grid
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real city map — live signal states, emergency dispatch & animated ambulance routing
          </p>
        </div>
        <Button variant="secondary" size="sm" disabled={compute.isPending}
          onClick={() => compute.mutate({}, { onSuccess: () => qc.invalidateQueries({ queryKey: getListSignalsQueryKey() }) })}
          className="uppercase text-xs font-bold tracking-wider"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${compute.isPending ? "animate-spin" : ""}`} />
          Sync Signals
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-wider">
        {[
          { color: "#10b981", label: "Green Signal", round: true },
          { color: "#ef4444", label: "Red Signal",   round: true },
          { color: "#10b981", label: "Hospital",     round: false },
          { color: "#ef4444", label: "Ambulance",    round: true },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 ${l.round ? "rounded-full" : "rounded-sm"}`} style={{ background: l.color }} />
            <span className="text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── MAP ── */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-border" style={{ height: 540 }}>
          <MapContainer center={[26.8467, 80.9462]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <FlyTo center={[26.8467, 80.9462]} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Intersection markers */}
            {intersections?.map(ix => {
              const lat = (ix as unknown as { lat?: number }).lat;
              const lng = (ix as unknown as { lng?: number }).lng;
              if (lat == null || lng == null) return null;
              const state = intersectionSignal(ix.id);
              const color = signalColor(state);
              const ixSigs = signals?.filter(s => s.intersectionId === ix.id) ?? [];
              const total = ixSigs.reduce((n, s) => n + s.carCount, 0);
              return (
                <Marker key={`ix-${ix.id}`} position={[lat, lng]} icon={circleIcon(color, 28)}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 12, minWidth: 170 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{ix.name}</div>
                      <div style={{ color: "#71717a", marginBottom: 6 }}>{ix.location}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                        <span style={{ color, fontWeight: 700, textTransform: "uppercase" }}>{state}</span>
                      </div>
                      <div style={{ marginBottom: 6 }}>Total cars: <strong>{total}</strong></div>
                      {ixSigs.map(s => (
                        <div key={s.id} style={{ color: "#71717a", fontSize: 10, lineHeight: 1.6 }}>
                          {s.direction}: {s.carCount} cars — G:{s.greenDuration}s R:{s.redDuration}s
                        </div>
                      ))}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Hospital markers */}
            {hospitals?.map(h => {
              const lat = (h as unknown as { lat?: number }).lat;
              const lng = (h as unknown as { lng?: number }).lng;
              if (lat == null || lng == null) return null;
              return (
                <Marker key={`h-${h.id}`} position={[lat, lng]} icon={hospitalIcon()}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: "#10b981", fontSize: 13, marginBottom: 3 }}>{h.name}</div>
                      <div style={{ color: "#71717a" }}>{h.location}</div>
                      <div style={{ color: "#52525b", fontSize: 10, marginTop: 4 }}>Emergency Facility</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Ambulance simulations — use Fragment, NOT div */}
            {sims.map(sim => {
              if (sim.route.length < 2) return null;
              const pos = interpolate(sim.route, sim.progress);
              // Build the "traveled" segment
              const traveled: [number, number][] = [];
              const segs = sim.route.length - 1;
              const rawSeg = sim.progress * segs;
              const segIdx = Math.min(Math.floor(rawSeg), segs - 1);
              for (let i = 0; i <= segIdx; i++) traveled.push(sim.route[i]);
              traveled.push(pos);

              return (
                <>
                  {/* Planned route (dashed) */}
                  <Polyline key={`plan-${sim.id}`} positions={sim.route}
                    pathOptions={{ color: "#ef444430", weight: 5, dashArray: "10 7" }} />
                  {/* Traveled (solid red) */}
                  {traveled.length >= 2 && (
                    <Polyline key={`done-${sim.id}`} positions={traveled}
                      pathOptions={{ color: "#ef4444", weight: 5, lineCap: "round" }} />
                  )}
                  {/* Ambulance dot */}
                  {!sim.done && (
                    <Marker key={`amb-${sim.id}`} position={pos} icon={ambulanceIcon()}>
                      <Popup>
                        <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                          <strong>AMB-{String(sim.id).padStart(4, "0")}</strong><br />
                          From: {sim.sourceRoadName}<br />
                          To: {sim.hospitalName}<br />
                          Progress: {Math.round(sim.progress * 100)}%
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </>
              );
            })}
          </MapContainer>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-4">

          {/* Dispatch */}
          <div className="bg-card border border-destructive/40 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/30 flex items-center gap-2">
              <Siren className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-black uppercase tracking-widest text-destructive">Emergency Dispatch</span>
            </div>
            <div className="p-4 space-y-3">
              <Select value={selectedRoad} onValueChange={setSelectedRoad}>
                <SelectTrigger className="font-mono text-xs bg-background">
                  <SelectValue placeholder="Select origin road" />
                </SelectTrigger>
                <SelectContent>
                  {roads?.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.carCount} cars)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleDispatch} disabled={!selectedRoad || dispatch.isPending}
                className="w-full bg-destructive hover:bg-destructive/90 text-xs font-black uppercase tracking-wider">
                {dispatch.isPending
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />Routing...</>
                  : <><Siren className="h-3.5 w-3.5 mr-2" />Dispatch + Simulate</>}
              </Button>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Finds the nearest hospital by lowest traffic load and animates the route on the map.
              </p>
            </div>
          </div>

          {/* Active routes */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Routes</span>
            </div>
            <div className="p-3 space-y-3">
              <AnimatePresence>
                {sims.length === 0
                  ? <p className="text-[10px] text-muted-foreground text-center py-4 uppercase tracking-wider">No active simulations</p>
                  : sims.map(sim => (
                    <motion.div key={sim.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          AMB-{String(sim.id).padStart(4, "0")}
                        </span>
                        <Badge variant={sim.done ? "secondary" : "destructive"} className="text-[9px] uppercase">
                          {sim.done ? "Arrived" : "En Route"}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate">→ {sim.hospitalName}</div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div className="h-full bg-destructive rounded-full"
                          animate={{ width: `${sim.progress * 100}%` }} transition={{ duration: 0.05 }} />
                      </div>
                      <div className="text-[9px] text-right font-mono text-muted-foreground">
                        {Math.round(sim.progress * 100)}%
                      </div>
                    </motion.div>
                  ))
                }
              </AnimatePresence>
            </div>
          </div>

          {/* Signal status */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Signal Status</span>
            </div>
            <div className="p-3 space-y-1.5 max-h-52 overflow-y-auto">
              {intersections?.map(ix => {
                const state = intersectionSignal(ix.id);
                const color = signalColor(state);
                const total = (signals?.filter(s => s.intersectionId === ix.id) ?? []).reduce((n, s) => n + s.carCount, 0);
                return (
                  <div key={ix.id} className="flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-muted-foreground truncate">{ix.name}</span>
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-1">{total} cars</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity log */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Activity Log</span>
            </div>
            <div className="p-3 space-y-1 max-h-44 overflow-y-auto">
              {log.length === 0
                ? <p className="text-[10px] text-muted-foreground text-center py-3 uppercase tracking-wider">Awaiting events...</p>
                : log.map((entry, i) => (
                  <div key={i} className="text-[9px] font-mono text-muted-foreground leading-relaxed border-b border-border/40 pb-1 last:border-0">
                    {entry}
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
