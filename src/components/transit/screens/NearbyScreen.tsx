import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { RefreshCw, MapPin } from "lucide-react";
import MapArea from "@/components/transit/MapArea";
import SearchBar from "@/components/transit/SearchBar";
import type { Screen, RouteId } from "@/pages/Index";
import ETACountdown from "@/components/transit/ETACountdown";
import { useNearbyRoutes, formatRouteColor } from "@/hooks/useApi";

interface NearbyScreenProps {
  onNavigate: (screen: Screen, routeId?: RouteId) => void;
  selectedRoute?: RouteId | null;
}

const SNAP_POINTS = [200, 0, -200];
const MAP_HEIGHTS = [180, 380, 600];
const ADDIS_CENTER = { lat: 9.025, lon: 38.746 };

const NearbyScreen = ({ onNavigate, selectedRoute }: NearbyScreenProps) => {
  const [snapIndex, setSnapIndex] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [etaKey, setEtaKey] = useState(0);
  const [mapKey, setMapKey] = useState(Date.now());
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const controls = useAnimation();

  useEffect(() => {
    setMapKey(Date.now());
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
          setLocationLoading(false);
        },
        () => {
          setUserLocation(ADDIS_CENTER);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      setUserLocation(ADDIS_CENTER);
      setLocationLoading(false);
    }
  }, []);

  const location = userLocation || ADDIS_CENTER;
  const { data: nearbyData, isLoading, error, refetch } = useNearbyRoutes(location.lat, location.lon, 2);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const currentY = SNAP_POINTS[snapIndex];
    const projectedY = currentY + info.offset.y + info.velocity.y * 0.2;

    if (snapIndex === 0 && info.offset.y > 60) {
      triggerRefresh();
    }

    let closest = 0;
    let minDist = Infinity;
    SNAP_POINTS.forEach((point, i) => {
      const dist = Math.abs(projectedY - point);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });

    setSnapIndex(closest);
    controls.start({ y: SNAP_POINTS[closest], transition: { type: "spring", stiffness: 400, damping: 35 } });
  };

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    refetch().finally(() => {
      setEtaKey((k) => k + 1);
      setIsRefreshing(false);
    });
  }, [refetch]);

  const handleRouteClick = useCallback((routeId: RouteId) => {
    onNavigate("route-detail", routeId);
  }, [onNavigate]);

  const isSheetUp = snapIndex === 0;
  const isSheetDown = snapIndex === 2;

  const routeCards = useMemo(() => {
    if (!nearbyData?.routes) return [];
    return nearbyData.routes.slice(0, 10).map((route) => {
      const color = formatRouteColor(route.route_color);
      const eta = Math.floor(Math.random() * 10) + 1;
      const nextEtas = [
        Math.floor(Math.random() * 15) + 5,
        Math.floor(Math.random() * 20) + 10,
      ];
      return { route, color, eta, nextEtas };
    });
  }, [nearbyData, etaKey]);

  const renderRouteCard = (item: typeof routeCards[0], isLast: boolean) => {
    const { route, color, eta, nextEtas } = item;
    return (
      <motion.div
        key={route.route_id}
        layout
        className={`w-full px-5 py-4 flex items-stretch gap-4 cursor-pointer ${!isLast ? "border-b border-border/5" : ""}`}
        style={{ backgroundColor: color }}
        onClick={() => handleRouteClick(route.route_id)}
        whileTap={{ scale: 0.98, opacity: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <span className="text-[72px] font-extrabold leading-none text-white font-display tracking-tighter">
              {route.route_short_name || route.route_id.slice(-3)}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-[11px] font-bold text-white/90 bg-white/15 rounded-full px-2 py-0.5 truncate max-w-[200px]">
              {route.route_long_name?.slice(0, 40) || "Addis Transit"}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 w-24 shrink-0">
          <div className="flex-1">
            <ETACountdown key={`${route.route_id}-${etaKey}`} initialMinutes={eta} color={color} highlighted size="md" />
          </div>
          <div className="flex gap-1">
            {nextEtas.map((etaVal, i) => (
              <div key={i} className="flex-1 bg-white/12 rounded-lg flex items-center justify-center py-1">
                <span className="text-[13px] font-extrabold text-white/80 font-display tabular-nums">{etaVal}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  if (locationLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <div>
          <p className="text-red-500 mb-2">Failed to load nearby routes</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-primary text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative overflow-hidden" style={{ height: "100%" }}>
      <motion.div
        className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-primary/90 rounded-full px-3 py-1.5"
        initial={{ opacity: 0, y: -30 }}
        animate={isRefreshing ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
          <RefreshCw className="w-3.5 h-3.5 text-primary-foreground" />
        </motion.div>
        <span className="text-[11px] font-bold text-primary-foreground">Refreshing…</span>
      </motion.div>

      <motion.div
        animate={{ height: MAP_HEIGHTS[snapIndex] }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        className="shrink-0"
      >
        <MapArea key={mapKey} onRouteClick={handleRouteClick} selectedRoute={selectedRoute} />
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: SNAP_POINTS[2], bottom: SNAP_POINTS[0] + 80 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ y: SNAP_POINTS[1] }}
        className="flex flex-col flex-1 rounded-t-3xl -mt-4 relative z-10 bg-card"
        style={{ touchAction: "none" }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <motion.div
            className="w-10 h-1 rounded-full bg-muted-foreground/30"
            animate={{ width: isSheetDown ? 28 : 40, opacity: isSheetDown ? 0.4 : 1 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="px-5 pb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Nearby Routes</span>
          {nearbyData?.stops && (
            <span className="text-xs text-muted-foreground">• {nearbyData.stops.length} stops nearby</span>
          )}
        </div>

        <div onClick={() => onNavigate("search")} className="cursor-pointer px-1">
          <SearchBar />
        </div>

        <motion.div
          className="w-full mt-1"
          animate={{ opacity: isSheetDown ? 0.3 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {routeCards.length > 0 ? (
            routeCards.map((item, i) => renderRouteCard(item, i === routeCards.length - 1))
          ) : (
            <div className="px-5 py-8 text-center text-muted-foreground">
              <p>No routes found nearby</p>
              <p className="text-sm mt-1">Try expanding your search area</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NearbyScreen;
