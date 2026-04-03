const API_BASE_URL = 'https://addis9transit.onrender.com/api';

export interface Route {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_desc: string | null;
  route_url: string | null;
  route_color: string;
  route_text_color: string;
  route_sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stop {
  stop_id: string;
  stop_code: string | null;
  stop_name: string;
  stop_lat: string;
  stop_lon: string;
  stop_url: string | null;
  location_type: number;
  parent_station: string | null;
  stop_timezone: string | null;
  wheelchair_boarding: number;
  level_id: string | null;
  platform_code: string | null;
  geom: {
    type: string;
    coordinates: [number, number];
  };
  created_at: string;
  updated_at: string;
  stop_sequence?: number;
  arrival_time?: string;
  departure_time?: string;
}

export interface StopEta {
  route_id: string;
  route_short_name: string;
  route_long_name?: string;
  route_color?: string;
  direction_id: number;
  trip_id: string;
  trip_headsign: string;
  scheduled_arrival_time: string;
  eta_minutes: number;
  is_live: boolean;
  vehicle_id?: string;
  is_delayed: boolean;
  delay_minutes?: number;
  distance_meters?: number;
  speed_kmh?: number;
  last_updated?: string;
  prediction_confidence?: 'high' | 'medium' | 'low';
}

export interface RoutesResponse {
  routes: Route[];
  total: number;
}

export interface StopsResponse {
  stops: Stop[];
  total: number;
}

export interface EtasResponse {
  stop_id: string;
  computed_at: string;
  etas: StopEta[];
}

// API client
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Get all routes
export async function getRoutes(): Promise<RoutesResponse> {
  return fetchApi<RoutesResponse>('/public/routes?limit=500&offset=0');
}

// Get all stops - API returns array directly
export async function getStops(): Promise<StopsResponse> {
  const data = await fetchApi<any>('/public/stops?limit=5000&offset=0');
  // Handle both array and object response
  if (Array.isArray(data)) {
    return { stops: data, total: data.length };
  }
  return data;
}

// Get stops for a route
export async function getRouteStops(routeId: string): Promise<{ route_id: string; stops: Stop[] }> {
  return fetchApi(`/public/routes/${routeId}/stops`);
}

// Get stop ETAs
export async function getStopEtas(stopId: string): Promise<EtasResponse> {
  const encodedStopId = encodeURIComponent(stopId);
  return fetchApi<EtasResponse>(`/public/stops/${encodedStopId}/etas`);
}

// Get route details
export async function getRoute(routeId: string): Promise<Route> {
  return fetchApi<Route>(`/public/routes/${routeId}`);
}

// Get stop details
export async function getStop(stopId: string): Promise<Stop> {
  const encodedStopId = encodeURIComponent(stopId);
  return fetchApi<Stop>(`/public/stops/${stopId}`);
}

// Update vehicle position
export async function updateVehiclePosition(
  apiKey: string,
  data: {
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    altitude?: number;
    passengers_onboard?: number;
    timestamp: string;
  }
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/vehicles/position`, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

// Get nearby routes based on location
export async function getNearbyRoutes(lat: number, lon: number, radius?: number): Promise<{
  user_location: { lat: number; lon: number };
  stops: Stop[];
  routes: Route[];
}> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
  });
  if (radius) {
    params.append('radius', radius.toString());
  }
  return fetchApi(`/public/nearby?${params.toString()}`);
}

// Get all vehicles (including simulated)
export async function getVehicles(): Promise<{ vehicles: Vehicle[] }> {
  return fetchApi('/public/vehicles');
}

// Vehicle interface for real-time data
export interface Vehicle {
  bus_id: string;
  bus_number: string;
  license_plate: string;
  device_id: string;
  trip_id: string;
  route_id: string;
  direction_id: number;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  passengers_onboard: number;
  last_seen_at: string;
  assignment_time: string;
  connectivity_status: 'online' | 'recently_online' | 'offline';
  is_simulated?: boolean;
  route_short_name?: string;
  route_color?: string;
  vehicle_label?: string;
}

// Route shape interface
export interface RouteShape {
  route_id: string;
  route_color: string;
  route_text_color: string;
  route_short_name: string;
  route_long_name: string;
  shape_id: string;
  shapes: Array<{ lat: number; lon: number; sequence: number }>;
}

// Get route shape for map
export async function getRouteShape(routeId: string): Promise<RouteShape> {
  return fetchApi(`/public/routes/${routeId}/shape`);
}

// Trip planner types
export interface TripOption {
  id: number;
  departTime: string;
  arriveTime: string;
  duration: string;
  transfers: number;
  legs: Array<{
    type: string;
    label: string;
    color: string;
    duration: string;
  }>;
  route_id?: string;
  trip_id?: string;
}

export interface TripPlanResponse {
  from_stop_id: string;
  to_stop_id: string;
  options: TripOption[];
}

// Plan trip between stops
export async function planTrip(fromStopId: string, toStopId: string): Promise<TripPlanResponse> {
  return fetchApi(`/public/plan/${encodeURIComponent(fromStopId)}/${encodeURIComponent(toStopId)}`);
}