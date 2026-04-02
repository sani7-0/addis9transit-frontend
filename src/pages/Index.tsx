import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NearbyScreen from "@/components/transit/screens/NearbyScreen";
import RouteDetailScreen from "@/components/transit/screens/RouteDetailScreen";
import TripDetailScreen from "@/components/transit/screens/TripDetailScreen";
import SearchScreen from "@/components/transit/screens/SearchScreen";
import ScheduleScreen from "@/components/transit/screens/ScheduleScreen";
import PlannerScreen from "@/components/transit/screens/PlannerScreen";
import BottomNav from "@/components/transit/BottomNav";

export type Screen =
  | "nearby"
  | "route-detail"
  | "trip-detail"
  | "search"
  | "schedule"
  | "planner";

export type RouteId = string;

const screenOrder: Record<Screen, number> = {
  nearby: 0,
  search: 1,
  planner: 2,
  schedule: 3,
  "route-detail": 4,
  "trip-detail": 5,
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("nearby");
  const [selectedRoute, setSelectedRoute] = useState<RouteId>("10400029");
  const [direction, setDirection] = useState(1);
  const [isDark, setIsDark] = useState(false);

  const handleNavigate = (s: Screen, routeId?: RouteId) => {
    setDirection(screenOrder[s] > screenOrder[screen] ? 1 : -1);
    setScreen(s);
    if (routeId) setSelectedRoute(routeId);
  };

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const renderScreen = () => {
    switch (screen) {
      case "nearby":
        return <NearbyScreen onNavigate={handleNavigate} selectedRoute={selectedRoute} />;
      case "route-detail":
        return <RouteDetailScreen onNavigate={handleNavigate} selectedRoute={selectedRoute} />;
      case "trip-detail":
        return <TripDetailScreen onNavigate={handleNavigate} />;
      case "search":
        return <SearchScreen onNavigate={handleNavigate} />;
      case "schedule":
        return <ScheduleScreen onNavigate={handleNavigate} />;
      case "planner":
        return <PlannerScreen onNavigate={handleNavigate} />;
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "25%" : "-25%",
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-25%" : "25%",
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="w-full h-screen bg-background relative flex flex-col overflow-hidden">
      <motion.button
        onClick={toggleDark}
        className="absolute top-2 right-2 z-50 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center text-xs"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.1 }}
      >
        {isDark ? "☀️" : "🌙"}
      </motion.button>

      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={screen}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1],
                opacity: { duration: 0.2 },
                scale: { duration: 0.25 }
              }}
              className="min-h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
      </div>
      <BottomNav currentScreen={screen} onNavigate={handleNavigate} />
    </div>
  );
};

export default Index;
