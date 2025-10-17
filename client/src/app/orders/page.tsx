"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ShoppingBag,
  Home,
  LogOut,
  User,
  DollarSign,
  Calendar,
  Package,
  X,
  Menu as MenuIcon,
  PlusCircle,
  Utensils,
  MapPin,
  Compass,
} from "lucide-react";
import { useRouter } from "next/navigation";


interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Restaurant {
  _id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Order {
  _id: string;
  date: string;
  items: OrderItem[];
  amount: number;
  status: string;
  userId: string | { _id: string; toString(): string };
  restaurantId: string | { _id: string; toString(): string };
  customerName?: string;
  userData?: UserData;
  userLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    distance?: number;
  };
  restaurant?: Restaurant;
}


function extractId(id: string | { _id: string; toString(): string }): string {
  if (typeof id === 'string') {
    return id;
  }
  return id.toString ? id.toString() : id._id;
}


function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}


function getDirectionsUrl(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  originName?: string,
  destName?: string
): string {
  const origin = `${originLat},${originLon}`;
  const destination = `${destLat},${destLon}`;

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving&origin_place_id=${originName || ''}&destination_place_id=${destName || ''}`;
}


const safeReverseGeocode = async (lat: number, lon: number, retries = 2): Promise<string> => {
  const fallbackAddress = `Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}`;

  if (!lat || !lon) return fallbackAddress;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.display_name) {
        return data.display_name;
      }

      return fallbackAddress;
    } catch (error) {
      console.warn(`Reverse geocode attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        return fallbackAddress;
      }
    }
  }

  return fallbackAddress;
};


const StatusChip = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    delivered: "bg-green-100 text-green-700",
    "in process": "bg-yellow-100 text-yellow-700",
    ordered: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || "bg-gray-100 text-gray-700"
        }`}
    >
      {status}
    </span>
  );
};


interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const OrderCard = ({ order, onStatusChange }: OrderCardProps) => {
  const mapsLink = order.userLocation && order.restaurant
    ? getDirectionsUrl(
      order.restaurant.latitude,
      order.restaurant.longitude,
      order.userLocation.latitude,
      order.userLocation.longitude,
      order.restaurant.name,
      order.userData?.name || "Customer Location"
    )
    : "#";

  return (
    <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition duration-200">
      <div className="flex justify-between items-start mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-gray-500" />
          <div>
            <h3 className="text-lg font-bold text-gray-800">Name:  
               {order.userData?.name || order.customerName || "Unknown Customer"}
            </h3>
            {order.userData?.email && (
              <p className="text-xs text-gray-500">Email: {order.userData.email}</p>
            )}
            {order.userData?.phone && (
              <p className="text-xs text-gray-500">Phone: {order.userData.phone}</p>
            )}
          </div>
        </div>
        <StatusChip status={order.status} />
      </div>

      {/* RESTAURANT INFO */}
      {order.restaurant && (
        <div className="mb-4 p-3 bg-rose-50 rounded-lg border border-rose-200">
          <div className="flex items-center gap-2 mb-2">
            <Utensils size={16} className="text-rose-600" />
            <span className="font-semibold text-rose-800 text-sm">Restaurant:</span>
          </div>
          <p className="text-sm text-rose-700 font-medium">{order.restaurant.name}</p>
          {order.restaurant.address && (
            <p className="text-xs text-rose-600 mt-1">{order.restaurant.address}</p>
          )}
        </div>
      )}

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center justify-between pb-1 border-b border-dashed">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-rose-500" />
            <span className="font-medium">Total Amount:</span>
          </div>
          <span className="font-bold text-xl text-rose-600">
            $ {order.amount.toFixed(2)}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-gray-500" />
            <span className="font-medium text-gray-700">Items Ordered:</span>
          </div>
          <ul className="list-none pl-0 space-y-0.5 text-xs bg-gray-50 p-2">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-gray-500">{idx + 1}.</span>
                <span className="text-gray-800 font-medium">{item.name}</span>{" "}
                -{" "}
                <span className="text-gray-500">
                  $ {item.price.toFixed(2)} × {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-dashed">
          <Calendar size={16} className="text-gray-500" />
          <span className="font-medium">Order Date:</span>
          <span className="flex-1 text-right">
            {new Date(order.date).toLocaleString("en-IN")}
          </span>
        </div>

        {/* USER LOCATION + DISTANCE */}
        {order.userLocation && order.restaurant && (
          <div className="flex flex-col gap-2 pt-2 border-t border-dashed text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-rose-500" />
                <span className="text-gray-800 font-medium">Delivery Address:</span>
              </div>
              <span className="text-right text-gray-700 truncate max-w-[200px]">
                {order.userLocation.address}
              </span>
            </div>

            {order.userLocation.distance && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Delivery Distance:</span>
                <span className="font-semibold text-rose-600">
                  {order.userLocation.distance} km
                </span>
              </div>
            )}

            <div className="flex justify-end mt-1">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-rose-700 transition"
              >
                <Compass size={14} /> Get Directions
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <label
          htmlFor={`status-select-${order._id}`}
          className="block text-xs font-medium text-gray-500 mb-1"
        >
          Update Status:
        </label>
        <select
          id={`status-select-${order._id}`}
          value={order.status}
          onChange={(e) => onStatusChange(order._id, e.target.value)}
          className={`w-full px-2 py-2 rounded-lg border focus:ring-rose-500 focus:border-rose-500 transition duration-150 cursor-pointer text-sm ${order.status === "delivered"
              ? "bg-green-50 border-green-300 text-green-700"
              : order.status === "in process"
                ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                : "bg-blue-50 border-blue-300 text-blue-700"
            }`}
        >
          <option value="ordered">Pending</option>
          <option value="in process">Preparing</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
    </div>
  );
};


// MAIN COMPONENT
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  // Fetch restaurant data by ID
  const fetchRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const res = await axios.get(`/api/restaurants/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.restaurant;
    } catch (error) {
      console.error(`Failed to fetch restaurant ${restaurantId}:`, error);
      return null;
    }
  };

  // Alternative: Fetch all users at once and map them
  const fetchAllUsers = async (): Promise<Record<string, UserData>> => {
    const token = localStorage.getItem("token");
    if (!token) return {};

    try {
      const res = await axios.get(`/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      if (res.data && res.data.users) {
        const usersMap: Record<string, UserData> = {};
        res.data.users.forEach((user: UserData) => {
          usersMap[user._id] = user;
        });
        return usersMap;
      }
      return {};
    } catch (error: any) {
      // If /api/users endpoint doesn't exist, return empty map
      if (error.response?.status !== 404) {
        console.error("Failed to fetch users:", error);
      }
      return {};
    }
  };

  // Process orders in batches to avoid rate limiting
  const processOrdersBatch = async (orders: any[], usersMap: Record<string, UserData>): Promise<Order[]> => {
    const processedOrders: Order[] = [];

    for (let i = 0; i < orders.length; i++) {
      const o = orders[i];

      try {
        // Extract restaurantId (handles both string and ObjectId)
        const restaurantId = o.restaurantId ? extractId(o.restaurantId) : null;

        // Fetch restaurant data
        let restaurant: Restaurant | undefined;
        if (restaurantId) {
          restaurant = (await fetchRestaurantById(restaurantId)) ?? undefined;
        }

        // Extract userId (handles both string and ObjectId)
        const userId = o.userId ? extractId(o.userId) : null;

        // Fetch user data - try from map first, then individual API if needed
        let userData: UserData | undefined;
        if (userId) {
          // Try to get user from pre-fetched map
          userData = usersMap[userId];

          // If not found in map and we have individual user API, try that
        }

        let userLocation:
          | { latitude: number; longitude: number; address?: string; distance?: number }
          | undefined;

        if (o.latitude && o.longitude && restaurant) {
          userLocation = {
            latitude: o.latitude,
            longitude: o.longitude,
          };

          // Calculate distance (Restaurant → User)
          userLocation.distance = getDistanceKm(
            restaurant.latitude,
            restaurant.longitude,
            o.latitude,
            o.longitude
          );

          // Use safe reverse geocoding with retry logic
          userLocation.address = await safeReverseGeocode(o.latitude, o.longitude);
        }

        processedOrders.push({
          _id: o._id,
          date: o.date,
          items: o.items,
          amount: o.amount,
          status: o.orderStatus,
          userId: o.userId,
          restaurantId: o.restaurantId,
          customerName: o.customerName || "Unknown",
          userData,
          userLocation,
          restaurant,
        });

        // Add delay between geocoding requests to avoid rate limiting
        if (o.latitude && o.longitude) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Failed to process order ${o._id}:`, error);
        // Push order without additional data if processing fails
        processedOrders.push({
          _id: o._id,
          date: o.date,
          items: o.items,
          amount: o.amount,
          status: o.orderStatus,
          userId: o.userId,
          restaurantId: o.restaurantId,
          customerName: o.customerName || "Unknown",
        });
      }
    }

    return processedOrders;
  };

  // Fetch orders with restaurant, user, and distance data
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        setLoading(true);

        // First, try to fetch all users at once (more efficient)
        const usersMap = await fetchAllUsers();

        // Then fetch orders
        const res = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });

        // Process orders sequentially to avoid rate limiting
        const ordersData = await processOrdersBatch(res.data.orders, usersMap);
        setOrders(ordersData);

      } catch (err: any) {
        console.error("Failed to fetch orders:", err);
        if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
          setError("Network error: Please check your internet connection and try again.");
        } else if (err.response?.status === 404) {
          setError("Orders endpoint not found. Please check your API routes.");
        } else {
          setError("Failed to fetch orders. Please try again later.");
        }
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      await axios.patch(
        `/api/orders/${orderId}`,
        { orderStatus: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update order status");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-20 bg-white shadow-md w-64 min-h-screen p-6 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        <button
          className="absolute top-4 right-4 md:hidden text-gray-500 hover:text-rose-600"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={22} />
        </button>
        <h2 className="text-2xl font-bold text-rose-600 mb-8 flex items-center gap-2">
          Tomato
        </h2>
        <nav className="flex flex-col gap-3 text-gray-700">
          <Link
            href="/"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
          >
            <Home size={18} /> Home
          </Link>
          <Link
            href="/add-restaurant"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
          >
            <PlusCircle size={18} /> Add Restaurant
          </Link>
          <Link
            href="/menu"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
          >
            <Utensils size={18} /> Manage Menu
          </Link>
          <Link
            href="/orders"
            className="flex items-center gap-3 p-2 rounded-lg bg-rose-600 text-white cursor-pointer"
          >
            <ShoppingBag size={18} /> Orders
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
          >
            <User size={18} /> Profile
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              router.push("/login");
              setSidebarOpen(false);
            }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 text-left"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 md:ml-64 transition-all duration-300">
        <button
          className="fixed md:hidden mb-4 bg-rose-600 text-white px-2 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon size={18} /> Menu
        </button>

        <h1 className="text-2xl md:text-3xl mt-12 md:mt-2 font-bold text-rose-600 flex items-center gap-2 mb-6">
          <ShoppingBag size={28} /> Order Management
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
            <p className="ml-4 text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10">
            <Package size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No orders available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        <ToastContainer position="top-right" autoClose={4000} />
      </main>
    </div>
  );
}