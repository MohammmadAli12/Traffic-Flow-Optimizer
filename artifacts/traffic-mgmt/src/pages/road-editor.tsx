import { useEffect, useState, useCallback, useRef } from "react";
import {
  useListIntersections,
  useListRoads,
  getListRoadsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Save, RotateCcw, MapPin, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Icon factories ────────────────────────────────────────────────────────────
function intersectionIcon(color = "#3b82f6"): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 0 14px ${color},0 2px 8px rgba(0,0,0,0.7);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function pointIcon(index: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:24px;height:24px;border-radius:50%;
      background:#ef4444;border:2px solid #fff;
      box-shadow:0 0 10px #ef4444;
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:900;color:#fff;
    ">${index}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

// ── Map click handler ────────────────────────────────────────────────────────
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RoadEditor() {
  const qc = useQueryClient();

  const { data: intersectionsData } = useListIntersections();
  const intersections = Array.isArray(intersectionsData)
    ? intersectionsData
    : intersectionsData?.data || [];

  const { data: roadsData } = useListRoads();
  const roads = Array.isArray(roadsData)
    ? roadsData
    : roadsData?.data || [];

  const [selectedRoadId, setSelectedRoadId] = useState<string>("");
  const [drawingMode, setDrawingMode] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedRoad = roads.find(r => r.id === parseInt(selectedRoadId, 10));

  // Load existing coordinates when road is selected
  useEffect(() => {
    if (selectedRoad) {
      const coords = (selectedRoad as any).coordinates as [number, number][] | undefined;
      setCoordinates(coords || []);
      setDrawingMode(false);
    }
  }, [selectedRoad]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!drawingMode) return;
    setCoordinates(prev => [...prev, [lat, lng]]);
  }, [drawingMode]);

  const handleUndo = () => {
    setCoordinates(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setCoordinates([]);
    setDrawingMode(false);
  };

  const handleSave = async () => {
    console.log("=== SAVE CLICKED ===");
    console.log("selectedRoad:", selectedRoad);
    console.log("coordinates.length:", coordinates.length);
    
    if (!selectedRoad || coordinates.length < 2) {
      const msg = "Need at least 2 points to save a road";
      console.warn(msg, { selectedRoad, coordLength: coordinates.length });
      setMessage({ type: "error", text: msg });
      return;
    }

    setSaving(true);
    try {
      const url = `/api/roads/${selectedRoad.id}`;
      const body = { coordinates };
      
      console.log("Sending PATCH request to:", url);
      console.log("Request body:", body);

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        let errorMsg = "Failed to save road coordinates";
        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("Save successful:", data);

      setMessage({ type: "success", text: `✓ Saved ${coordinates.length} points for ${selectedRoad.name}` });
      qc.invalidateQueries({ queryKey: getListRoadsQueryKey() });
      setDrawingMode(false);

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      const errorMsg = (err as Error).message;
      console.error("Save error:", errorMsg);
      console.error("Full error:", err);
      setMessage({ type: "error", text: `Error: ${errorMsg}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 bg-white min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3 text-black">
          <MapPin className="h-6 w-6" /> Road Coordinate Editor
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Draw road paths on the map to define ambulance routes
        </p>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg text-sm font-mono flex items-start gap-2 ${
              message.type === "success"
                ? "bg-emerald-950 border border-emerald-500 text-emerald-400"
                : "bg-red-950 border border-red-500 text-red-400"
            }`}
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>{message.text}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* ── MAP ── */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border-2 border-gray-300" style={{ height: 540 }}>
          <MapContainer center={[26.8467, 80.9462]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Map click handler */}
            {drawingMode && <MapClickHandler onMapClick={handleMapClick} />}

            {/* Intersection markers */}
            {intersections.map(ix => {
              const lat = (ix as unknown as { lat?: number }).lat;
              const lng = (ix as unknown as { lng?: number }).lng;
              if (lat == null || lng == null) return null;
              return (
                <Marker key={`ix-${ix.id}`} position={[lat, lng]} icon={intersectionIcon()}>
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{ix.name}</div>
                      <div style={{ color: "#71717a" }}>{ix.location}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Drawn coordinates */}
            {coordinates.length > 0 && (
              <>
                {/* Line connecting all points */}
                <Polyline
                  positions={coordinates}
                  pathOptions={{
                    color: "#ef4444",
                    weight: 4,
                    opacity: 0.8,
                    dashArray: drawingMode ? "5 5" : undefined,
                  }}
                />

                {/* Point markers */}
                {coordinates.map((coord, i) => (
                  <Marker key={`point-${i}`} position={coord} icon={pointIcon(i + 1)}>
                    <Popup>
                      <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                        Point {i + 1}<br />
                        Lat: {coord[0].toFixed(6)}<br />
                        Lng: {coord[1].toFixed(6)}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="space-y-4">
          {/* Road selector */}
          <Card className="bg-white border-2 border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest flex items-center gap-2 text-black">
                <Pencil className="h-4 w-4" /> Select Road
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={selectedRoadId} onValueChange={setSelectedRoadId}>
                <SelectTrigger className="font-mono text-xs bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Choose a road..." />
                </SelectTrigger>
                <SelectContent>
                  {roads.map(r => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name} ({r.direction})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRoad && (
                <div className="text-xs space-y-1 p-2 bg-blue-50 rounded border-2 border-blue-300">
                  <div className="font-mono font-bold text-black">{selectedRoad.name}</div>
                  <div className="text-gray-600">{selectedRoad.direction}</div>
                  <div className="text-gray-600">
                    {coordinates.length} points
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drawing controls */}
          <Card className="bg-white border-2 border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-black">Drawing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => setDrawingMode(!drawingMode)}
                disabled={!selectedRoad}
                variant={drawingMode ? "default" : "outline"}
                className="w-full text-xs font-bold uppercase tracking-wider"
              >
                {drawingMode ? "🎯 Drawing Active" : "Start Drawing"}
              </Button>

              <Button
                onClick={handleUndo}
                disabled={coordinates.length === 0 || !drawingMode}
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold uppercase tracking-wider"
              >
                ↶ Undo Last Point
              </Button>

              <Button
                onClick={handleClear}
                disabled={coordinates.length === 0}
                variant="outline"
                size="sm"
                className="w-full text-xs font-bold uppercase tracking-wider text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear All
              </Button>
            </CardContent>
          </Card>

          {/* Coordinates list */}
          <Card className="bg-white border-2 border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-black">
                Points ({coordinates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-40 overflow-y-auto text-[10px] font-mono">
                {coordinates.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No points yet</p>
                ) : (
                  coordinates.map((coord, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-1.5 bg-gray-100 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <span className="text-gray-600">#{i + 1}</span>
                      <span className="text-black">
                        {coord[0].toFixed(4)}, {coord[1].toFixed(4)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <Button
            onClick={handleSave}
            disabled={!selectedRoad || coordinates.length < 2 || saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider"
          >
            {saving ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Coordinates
              </>
            )}
          </Button>

          {/* Instructions */}
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardContent className="pt-4 text-[10px] text-gray-600 space-y-2 leading-relaxed">
              <div className="font-bold text-black mb-2">How to use:</div>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Select a road from the dropdown</li>
                <li>Click "Start Drawing"</li>
                <li>Click on the map to add points</li>
                <li>Use "Undo" to remove last point</li>
                <li>Click "Save Coordinates" when done</li>
              </ol>
              <div className="pt-2 border-t border-gray-300 mt-2">
                <div className="font-bold text-black mb-1">Troubleshooting:</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Check browser console (F12) for errors</li>
                  <li>Ensure at least 2 points before saving</li>
                  <li>Verify road is selected</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
