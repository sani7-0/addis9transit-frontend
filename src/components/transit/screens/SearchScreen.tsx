import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Home, Briefcase, ChevronRight, MoreHorizontal, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Screen } from "@/pages/Index";
import { useRoutes, useStops, formatRouteColor } from "@/hooks/useApi";

interface SearchScreenProps {
  onNavigate: (screen: Screen, routeId?: string) => void;
}

const savedPlaces = [
  { icon: Home, title: "Home", subtitle: "Bole, Addis Ababa", filled: true },
  { icon: Briefcase, title: "Office", subtitle: "Kirkos, Addis Ababa", filled: true },
  { icon: MapPin, title: "Merkato", subtitle: "Addis Ababa", filled: true },
];

const recentPlaces = [
  { title: "Addis Ababa University", subtitle: "Sidist Kilo Campus" },
  { title: "Bole International Airport", subtitle: "Addis Ababa" },
  { title: "Meskel Square", subtitle: "Addis Ababa" },
  { title: "Holy Trinity Cathedral", subtitle: "Addis Ababa" },
];

const SearchScreen = ({ onNavigate }: SearchScreenProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch routes and stops from API
  const { data: routesData } = useRoutes();
  const { data: stopsData } = useStops();

  // Combine routes and stops for search
  const searchableItems = [
    ...(routesData?.routes?.map(route => ({
      id: route.route_id,
      type: 'route' as const,
      title: route.route_short_name || `Route ${route.route_id}`,
      subtitle: route.route_long_name || 'Addis Transit Route',
      color: formatRouteColor(route.route_color)
    })) || []),
    ...(stopsData?.stops?.slice(0, 20).map(stop => ({
      id: stop.stop_id,
      type: 'stop' as const,
      title: stop.stop_name,
      subtitle: `Stop • ${stop.stop_id}`,
      color: '#1B5E20'
    })) || [])
  ];

  // Add sample places from Addis Ababa
  const allPlaces = [
    ...searchableItems,
    ...savedPlaces.map(p => ({ id: p.title, type: 'place' as const, title: p.title, subtitle: p.subtitle, color: '#4A5568' })),
    ...recentPlaces.map(p => ({ id: p.title, type: 'place' as const, title: p.title, subtitle: p.subtitle, color: '#4A5568' })),
    { id: 'Bole Medhanealem', type: 'place', title: 'Bole Medhanealem', subtitle: 'Addis Ababa', color: '#4A5568' },
    { id: 'Arat Kilo', type: 'place', title: 'Arat Kilo', subtitle: 'Addis Ababa', color: '#4A5568' },
    { id: '6 Kilo', type: 'place', title: '6 Kilo', subtitle: 'Addis Ababa', color: '#4A5568' },
  ];

  const filtered = query.trim()
    ? allPlaces.filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.subtitle.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleItemClick = (item: typeof allPlaces[0]) => {
    if (item.type === 'route') {
      onNavigate("route-detail", item.id);
    } else if (item.type === 'stop') {
      onNavigate("planner");
    } else {
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
              placeholder="Search routes, stops, or places"
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
      <AnimatePresence mode="wait">
        {query.trim() ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col"
          >
            {filtered.length > 0 ? (
              filtered.map((item) => (
                <motion.button
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-4 border-b border-border/20 text-left active:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleItemClick(item)}
                >
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.type === 'route' ? (
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.title.slice(0, 2)}</span>
                    ) : (
                      <MapPin className="w-4 h-4" style={{ color: item.color }} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                  </div>
                </motion.button>
              ))
            ) : (
              <div className="flex flex-col items-center py-16 px-6">
                <Search className="w-10 h-10 text-muted-foreground mb-3" />
                <span className="text-base font-bold text-foreground">No results found</span>
                <span className="text-sm text-muted-foreground mt-1">Try searching for routes, stops, or places in Addis Ababa</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Recent destinations horizontal scroll */}
            <div className="px-5 pt-4 pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent destinations</span>
            </div>
            <div className="flex gap-2 px-5 pb-4 overflow-x-auto scrollbar-none">
              {recentPlaces.map((item) => (
                <motion.button
                  key={item.title}
                  className="flex items-center gap-2 bg-muted rounded-full px-3.5 py-2.5 shrink-0"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate("planner")}
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground whitespace-nowrap">{item.title}</span>
                </motion.button>
              ))}
            </div>

            {/* Choose on map */}
            <button
              onClick={() => onNavigate("nearby")}
              className="flex items-center justify-between px-5 py-4.5 border-b border-border/30 w-full active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-card" />
                </div>
                <span className="text-base font-bold text-foreground">Choose on map</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Saved places */}
            {savedPlaces.map((item) => (
              <SearchItem
                key={item.title}
                icon={<item.icon className="w-4 h-4" />}
                title={item.title}
                subtitle={item.subtitle}
                filled
                onTap={() => onNavigate("planner")}
              />
            ))}

            {/* Recent list */}
            <div className="px-5 pt-5 pb-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent</span>
            </div>

            {recentPlaces.map((item) => (
              <SearchItem
                key={item.title}
                icon={<MapPin className="w-4 h-4" />}
                title={item.title}
                subtitle={item.subtitle}
                filled={false}
                onTap={() => onNavigate("planner")}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SearchItem = ({
  icon,
  title,
  subtitle,
  filled = true,
  onTap,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  filled?: boolean;
  onTap?: () => void;
}) => (
  <motion.div
    className="flex items-center justify-between px-5 py-4 border-b border-border/20 cursor-pointer active:bg-muted/50 transition-colors"
    whileTap={{ scale: 0.98 }}
    onClick={onTap}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center ${
          filled ? "bg-foreground text-card" : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-base font-bold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </div>
    </div>
    <button className="p-1" onClick={(e) => e.stopPropagation()}>
      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
    </button>
  </motion.div>
);

export default SearchScreen;