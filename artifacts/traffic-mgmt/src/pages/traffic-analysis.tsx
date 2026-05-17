import { useEffect, useState } from "react";
import { useListRoads, useListIntersections } from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp } from "lucide-react";

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

function getTrafficColor(carCount: number, maxCars: number): string {
  const ratio = carCount / maxCars;
  if (ratio > 0.7) return "#ef4444"; // Red - Heavy traffic
  if (ratio > 0.4) return "#f97316"; // Orange - Moderate traffic
  return "#22c55e"; // Green - Light traffic
}

export function TrafficAnalysis() {
  const { data: roadsData } = useListRoads();
  const { data: intersectionsData } = useListIntersections();

  const roads = Array.isArray(roadsData) ? roadsData : roadsData?.data || [];
  const intersections = Array.isArray(intersectionsData) ? intersectionsData : intersectionsData?.data || [];

  const maxCars = Math.max(...roads.map(r => r.carCount), 1);

  // Group roads by traffic level
  const heavyTraffic = roads.filter(r => r.carCount / maxCars > 0.7).sort((a, b) => b.carCount - a.carCount);
  const moderateTraffic = roads.filter(r => r.carCount / maxCars > 0.4 && r.carCount / maxCars <= 0.7).sort((a, b) => b.carCount - a.carCount);
  const lightTraffic = roads.filter(r => r.carCount / maxCars <= 0.4).sort((a, b) => b.carCount - a.carCount);

  return (
    <div className="space-y-6 bg-white min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold uppercase tracking-tight flex items-center gap-3 text-black">
          <TrendingUp className="h-8 w-8" /> Traffic Analysis
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Real-time traffic visualization to identify congested routes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border-2 border-gray-300" style={{ height: 540 }}>
          <MapContainer center={[26.8467, 80.9462]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Intersections */}
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

            {/* Roads with traffic coloring */}
            {roads.map(road => {
              const coords = (road as any).coordinates as [number, number][] | undefined;
              if (!coords || coords.length < 2) return null;

              const color = getTrafficColor(road.carCount, maxCars);
              return (
                <Polyline
                  key={`road-${road.id}`}
                  positions={coords}
                  pathOptions={{
                    color,
                    weight: 5,
                    opacity: 0.8,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily: "monospace", fontSize: 11 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{road.name}</div>
                      <div>Direction: {road.direction}</div>
                      <div>Cars: {road.carCount}</div>
                      <div style={{ color }}>Traffic: {(road.carCount / maxCars * 100).toFixed(0)}%</div>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}
          </MapContainer>
        </div>

        {/* Traffic Stats */}
        <div className="space-y-4">
          {/* Legend */}
          <Card className="bg-white border-2 border-gray-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-black">Traffic Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-700">Heavy (70%+)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-orange-500 rounded"></div>
                <span className="text-xs text-gray-700">Moderate (40-70%)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-1 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-700">Light (&lt;40%)</span>
              </div>
            </CardContent>
          </Card>

          {/* Heavy Traffic */}
          <Card className="bg-red-50 border-2 border-red-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-red-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Heavy Traffic ({heavyTraffic.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {heavyTraffic.length === 0 ? (
                  <p className="text-xs text-gray-500">No heavy traffic</p>
                ) : (
                  heavyTraffic.map(road => (
                    <div key={road.id} className="p-2 bg-white rounded border border-red-200">
                      <div className="text-xs font-bold text-red-900">{road.name}</div>
                      <div className="text-xs text-gray-600">{road.carCount} cars</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Moderate Traffic */}
          <Card className="bg-orange-50 border-2 border-orange-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-orange-900">Moderate ({moderateTraffic.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                {moderateTraffic.length === 0 ? (
                  <p className="text-gray-500">No moderate traffic</p>
                ) : (
                  moderateTraffic.map(road => (
                    <div key={road.id} className="text-gray-700">
                      {road.name}: {road.carCount} cars
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Light Traffic */}
          <Card className="bg-green-50 border-2 border-green-300">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-widest text-green-900">Light ({lightTraffic.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
                {lightTraffic.length === 0 ? (
                  <p className="text-gray-500">No light traffic</p>
                ) : (
                  lightTraffic.map(road => (
                    <div key={road.id} className="text-gray-700">
                      {road.name}: {road.carCount} cars
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-blue-50 border-2 border-blue-300">
            <CardContent className="pt-4 text-xs text-gray-700 space-y-2">
              <div className="font-bold text-blue-900 mb-2">Route Planning Tips:</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Green roads = fastest routes</li>
                <li>Red roads = avoid if possible</li>
                <li>Ambulance auto-selects best route</li>
                <li>Dispatch from light traffic areas</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
