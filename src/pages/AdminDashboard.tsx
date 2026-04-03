import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Map, Bus, BarChart2, AlertTriangle, LogOut } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "https://addis9transit.onrender.com";

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "routes" | "stops">("overview");
  const [stats, setStats] = useState<any>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      onLogout();
      return;
    }
    loadDashboard(token);
  }, []);

  const loadDashboard = async (token: string) => {
    setLoading(true);
    try {
      const [statsRes, routesRes, stopsRes] = await Promise.all([
        fetch(`${API}/api/v1/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/public/routes?limit=500&offset=0`),
        fetch(`${API}/api/public/stops?limit=5000&offset=0`),
      ]);

      const statsData = await statsRes.json();
      const routesData = await routesRes.json();
      const stopsData = await stopsRes.json();

      setStats(statsData.data || statsData);
      setRoutes(routesData.routes || []);
      setStops(Array.isArray(stopsData) ? stopsData : stopsData.stops || []);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-b from-green-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-10%] top-[-10%] h-72 w-72 rounded-full bg-green-200/40 blur-3xl dark:bg-green-900/30" />
        <div className="absolute left-[-10%] bottom-[-10%] h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/30" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-300">Overview of city data and system activity</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-semibold shadow"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        {/* Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-3 h-fit">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 mb-2">Menu</div>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                  activeTab === "overview"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("routes")}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                  activeTab === "routes"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                Routes ({routes.length})
              </button>
              <button
                onClick={() => setActiveTab("stops")}
                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                  activeTab === "stops"
                    ? "bg-emerald-600 text-white"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                Stops ({stops.length})
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {activeTab === "overview" && (
              <>
                <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl p-5 mb-6">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Overview</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Real-time statistics from the database</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatCard
                    icon={<Bus className="h-5 w-5" />}
                    title="Total Routes"
                    value={stats?.stats?.routes?.toString() || routes.length.toString()}
                  />
                  <StatCard
                    icon={<Map className="h-5 w-5" />}
                    title="Total Stops"
                    value={stats?.stats?.stops?.toString() || stops.length.toString()}
                  />
                  <StatCard
                    icon={<BarChart2 className="h-5 w-5" />}
                    title="Total Trips"
                    value={stats?.stats?.trips?.toString() || "0"}
                  />
                  <StatCard
                    icon={<Users className="h-5 w-5" />}
                    title="Agencies"
                    value={stats?.agencies?.length?.toString() || "0"}
                  />
                </div>

                {/* Agencies */}
                {stats?.agencies?.length > 0 && (
                  <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl p-5">
                    <h3 className="text-lg font-semibold mb-3">Transit Agencies</h3>
                    <div className="space-y-2">
                      {stats.agencies.map((agency: any) => (
                        <div key={agency.agency_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{agency.agency_name}</p>
                            <p className="text-xs text-gray-500">ID: {agency.agency_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "routes" && (
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold">All Routes ({routes.length})</h2>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                        <Th>Color</Th>
                        <Th>Short Name</Th>
                        <Th>Long Name</Th>
                        <Th>Type</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((r) => (
                        <tr key={r.route_id} className="border-t border-gray-100 dark:border-gray-800">
                          <td>
                            <div
                              className="w-6 h-6 rounded"
                              style={{ backgroundColor: r.route_color ? `#${r.route_color}` : "#ccc" }}
                            />
                          </td>
                          <td className="p-3 font-medium">{r.route_short_name || r.route_id.slice(-3)}</td>
                          <td className="p-3 max-w-xs truncate">{r.route_long_name || "-"}</td>
                          <td className="p-3">{r.route_type === 3 ? "Bus" : "Other"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "stops" && (
              <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold">All Stops ({stops.length})</h2>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                      <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                        <Th>Name</Th>
                        <Th>Latitude</Th>
                        <Th>Longitude</Th>
                        <Th>Code</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {stops.map((s) => (
                        <tr key={s.stop_id} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="p-3 font-medium">{s.stop_name}</td>
                          <td className="p-3">{s.stop_lat}</td>
                          <td className="p-3">{s.stop_lon}</td>
                          <td className="p-3">{s.stop_code || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">{children}</th>;
}
