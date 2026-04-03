import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Navigation, X, Bus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Screen, RouteId } from "@/pages/Index";
import { useRoutes, useStops, formatRouteColor } from "@/hooks/useApi";

interface SearchScreenProps {
  onNavigate: (screen: Screen, routeId?: RouteId) => void;
}

const SearchScreen = ({ onNavigate }: SearchScreenProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: routesData } = useRoutes();
  const { data: stopsData } = useStops();

  // Combine routes and stops for search
  const searchableItems = [
    ...(routesData?.routes?.map(route => ({
      id: route.route_id,
      type: 'route' as const,
      title: route.route_short_name || `Route ${route.route_id.slice(-3)}`,
      subtitle: route.route_long_name || 'Addis Transit Route',
      color: formatRouteColor(route.route_color)
    })) || []),
    ...(stopsData?.stops?.map(stop => ({
      id: stop.stop_id,
      type: 'stop' as const,
      title: stop.stop_name,
      subtitle: `Stop`,
      color: '#10B981'
    })) || [])
  ];

  const filtered = query.trim()
    ? searchableItems.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 15)
    : searchableItems.slice(0, 15);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleItemClick = (item: typeof searchableItems[0]) => {
    if (item.type === 'route') {
      onNavigate("route-detail", item.id);
    } else if (item.type === 'stop') {
      // Navigate to planner with stop pre-filled
      onNavigate("planner");
    }
  };

  return (
    <div className="flex flex-col bg-card min-h-full">
      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 bg-primary-foreground/15 rounded-full px-4 py-3.5">
            <Search className="w-4 h-4 text-primary-foreground/70" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search routes or stops..."
              className="bg-transparent text-base font-semibold text-primary-foreground placeholder:text-primary-foreground/50 outline-none flex-1 font-display"
            />
            {query && (
              <button onClick={() => setQuery("")}>
                <X className="w-4 h-4 text-primary-foreground/70" />
              </button>
            )}
          </div>
          <button
            onClick={() => onNavigate("nearby")}
            className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length > 0 ? (
          <div className="flex flex-col">
            {/* Section label */}
            <div className="px-5 pt-4 pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {query.trim() ? `Results (${filtered.length})` : 'All Routes & Stops'}
              </span>
            </div>

            {filtered.map((item) => (
              <motion.button
                key={item.id}
                className="flex items-center justify-between px-5 py-4 border-b border-border/20 cursor-pointer active:bg-muted/50 transition-colors"
                whileTap={{ scale: 0.98 }}
                onClick={() => handleItemClick(item)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: item.color + '20' }}
                  >
                    {item.type === 'route' ? (
                      <Bus className="w-5 h-5" style={{ color: item.color }} />
                    ) : (
                      <MapPin className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-base font-bold text-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.type === 'route' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type === 'route' ? 'ROUTE' : 'STOP'}
                  </span>
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 px-6">
            <Search className="w-10 h-10 text-muted-foreground mb-3" />
            <span className="text-base font-bold text-foreground">No results found</span>
            <span className="text-sm text-muted-foreground mt-1 text-center">
              Try searching for route names (AB097) or stop names
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
