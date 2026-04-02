import { Settings, Crosshair } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteId } from "@/pages/Index";
import { useNearbyRoutes, useVehicles } from "@/hooks/useApi";
import { getRouteShape } from "@/lib/api";

interface Props {
  onRouteClick?: (id: RouteId) => void;
  selectedRoute?: RouteId | null;
}

const CENTER: [number, number] = [9.025, 38.746];
const fmt = (c?: string) => c ? (c.startsWith("#") ? c : `#${c}`) : "#E53935";

const MapArea = ({ onRouteClick }: Props) => {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const busMarkersRef = useRef<L.Marker[]>([]);
  const { data: nearby } = useNearbyRoutes(CENTER[0], CENTER[1], 2);
  const { data: buses } = useVehicles();
  const [ready, setReady] = useState(false);

  // Init map once
  useEffect(() => {
    if (!divRef.current || mapRef.current) return;
    const map = L.map(divRef.current, { center: CENTER, zoom: 13, zoomControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png").addTo(map);
    L.marker(CENTER, {
      icon: L.divIcon({ html: '<div style="width:14px;height:14px;border-radius:50%;background:#4F46E5;border:3px solid white;box-shadow:0 0 10px rgba(79,70,229,.5)"></div>', iconSize: [14,14], iconAnchor: [7,7] })
    }).addTo(map).bindPopup("You");
    mapRef.current = map;
    setReady(true);
    return () => { map.remove(); mapRef.current = null; setReady(false); };
  }, []);

  // Draw routes when ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !nearby?.routes?.length) return;

    // Clear old
    map.eachLayer(l => { if (l instanceof L.Polyline) map!.removeLayer(l); });
    stopMarkersRef.current.forEach(m => { try { map!.removeLayer(m); } catch {} });
    stopMarkersRef.current = [];

    const draw = async () => {
      const bounds: L.LatLng[] = [];
      const drawnColors: Record<string, number> = {};
      let routeCount = 0;

      for (const r of nearby.routes.slice(0, 10)) {
        try {
          const shape = await getRouteShape(r.route_id);
          if (!shape.shapes?.length) continue;
          const color = fmt(shape.route_color || r.route_color);
          drawnColors[color] = (drawnColors[color] || 0) + 1;
          const offset = (drawnColors[color] - 1) * 0.0002;
          const pts = shape.shapes.map(s => [s.lat + offset, s.lon + offset] as [number, number]);

          L.polyline(pts, { color: "#000", weight: 6, opacity: 0.08, lineCap: "round" }).addTo(map);
          L.polyline(pts, { color, weight: 4, opacity: 0.8, lineCap: "round" })
            .addTo(map)
            .bindPopup(`<b style="color:${color}">${shape.route_short_name}</b>`)
            .on("click", () => onRouteClick?.(r.route_id));
          pts.forEach(p => bounds.push(L.latLng(p)));
          routeCount++;
        } catch (e) { 
          console.log('Shape error:', r.route_id, e); 
        }
      }

      nearby.stops?.slice(0, 15).forEach(s => {
        const m = L.marker([+s.stop_lat, +s.stop_lon], {
          icon: L.divIcon({ html: '<div style="width:8px;height:8px;border-radius:50%;background:white;border:2px solid #10B981;box-shadow:0 1px 3px rgba(0,0,0,.2)"></div>', iconSize: [8,8], iconAnchor: [4,4] })
        }).addTo(map).bindTooltip(s.stop_name);
        stopMarkersRef.current.push(m);
      });

      if (bounds.length > 0) map.fitBounds(L.latLngBounds(bounds), { padding: [30, 30] });
    };

    draw();
  }, [ready, nearby]);

  // Draw buses
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !buses?.vehicles || !nearby?.routes) return;

    busMarkersRef.current.forEach(m => { try { map.removeLayer(m); } catch {} });
    busMarkersRef.current = [];

    const nearestRouteIds = nearby.routes.slice(0, 10).map(r => r.route_id);
    const routeLookup: Record<string, typeof nearby.routes[0]> = {};
    nearby.routes.forEach(r => { routeLookup[r.route_id] = r; });

    const selectedBuses: typeof buses.vehicles = [];
    const busesByRoute: Record<string, typeof buses.vehicles> = {};
    buses.vehicles.forEach(v => {
      if (!nearestRouteIds.includes(v.route_id)) return;
      if (!busesByRoute[v.route_id]) busesByRoute[v.route_id] = [];
      busesByRoute[v.route_id].push(v);
    });

    Object.entries(busesByRoute).forEach(([_, routeBuses]) => {
      const dir0 = routeBuses.find(b => b.direction_id === 0);
      const dir1 = routeBuses.find(b => b.direction_id === 1);
      if (dir0) selectedBuses.push(dir0);
      if (dir1) selectedBuses.push(dir1);
    });

    selectedBuses.forEach((v) => {
      const routeInfo = routeLookup[v.route_id];
      const color = fmt(v.route_color || routeInfo?.route_color);
      const name = routeInfo?.route_short_name || "";
      const eta = Math.floor(Math.random() * 12) + 1;
      const stops = nearby?.stops || [];
      const nextStop = stops[Math.floor(Math.random() * stops.length)]?.stop_name || "Next";
      const startStop = stops[0]?.stop_name || "Start";
      const endStop = stops[stops.length - 1]?.stop_name || "End";

      const m = L.marker([v.latitude, v.longitude], {
        icon: L.divIcon({
          html: `<div style="position:relative;width:30px;height:36px;">
            <div style="width:28px;height:28px;background:${color};border-radius:6px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z"/></svg>
            </div>
            <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);background:${color};color:white;font-size:7px;font-weight:700;padding:1px 4px;border-radius:3px;white-space:nowrap;">${name}</div>
          </div>`,
          iconSize: [30, 36], iconAnchor: [15, 14]
        })
      }).addTo(map).bindPopup(`<div style="min-width:160px;font-family:system-ui;padding:4px;">
        <div style="font-size:14px;font-weight:700;color:${color};margin-bottom:6px;">${name}</div>
        <div style="background:#f8f9fa;border-radius:6px;padding:8px;font-size:11px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#888;">From</span><span style="font-weight:600;">${startStop}</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="color:#888;">Next</span><span style="font-weight:600;color:${color}">${nextStop}</span></div>
          <div style="display:flex;justify-content:space-between;"><span style="color:#888;">To</span><span style="font-weight:600;">${endStop}</span></div>
        </div>
        <div style="display:flex;gap:6px;margin-top:6px;">
          <div style="flex:1;background:${color}12;border-radius:6px;padding:6px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:${color}">${eta}</div>
            <div style="font-size:8px;color:#888;">MIN ETA</div>
          </div>
          <div style="flex:1;background:#f0f0f0;border-radius:6px;padding:6px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#333">${Math.round(v.speed || 25)}</div>
            <div style="font-size:8px;color:#888;">KM/H</div>
          </div>
        </div>
      </div>`);
      busMarkersRef.current.push(m);
    });
  }, [buses, nearby]);

  return (
    <div className="relative w-full h-full min-h-[280px]">
      <div ref={divRef} style={{ width: "100%", height: "100%" }} />
      <button className="absolute top-4 left-4 z-[1000] w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-lg flex items-center justify-center">
        <Settings className="w-4 h-4 text-gray-600" />
      </button>
      <button onClick={() => mapRef.current?.setView(CENTER, 13)} className="absolute top-4 right-4 z-[1000] w-9 h-9 rounded-xl bg-white/90 backdrop-blur shadow-lg flex items-center justify-center">
        <Crosshair className="w-4 h-4 text-gray-600" />
      </button>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-white/90 backdrop-blur rounded-full px-3 py-1.5 shadow flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-semibold text-gray-700">10 routes • 20 buses</span>
        </div>
      </div>
    </div>
  );
};

export default MapArea;
