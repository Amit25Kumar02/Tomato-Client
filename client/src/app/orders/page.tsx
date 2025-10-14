'use client';

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ShoppingBag, Home, LogOut, User, DollarSign,
  Calendar, Package, X, Menu as MenuIcon, PlusCircle,
  Utensils, MapPin, Compass
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- INTERFACES ---
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  date: string;
  items: OrderItem[];
  amount: number;
  status: string;
  userId: string;
  customerName?: string;
  userLocation?: { latitude: number; longitude: number; address?: string };
}

// --- STATUS CHIP COMPONENT ---
const StatusChip = ({ status }: { status: string }) => {
  let colorClass = "";
  switch (status) {
    case "delivered":
      colorClass = "bg-green-100 text-green-700";
      break;
    case "in process":
      colorClass = "bg-yellow-100 text-yellow-700";
      break;
    case "ordered":
      colorClass = "bg-blue-100 text-blue-700";
      break;
    default:
      colorClass = "bg-gray-100 text-gray-700";
      break;
  }
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
      {status}
    </span>
  );
};

// --- ORDER CARD COMPONENT ---
interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
}

const OrderCard = ({ order, onStatusChange }: OrderCardProps) => {
  const getDirectionsLink = () => {
    if (!order.userLocation) return "#";
    const { latitude, longitude } = order.userLocation;
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200 hover:shadow-lg transition duration-200">
      <div className="flex justify-between items-start mb-4 border-b pb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-gray-500" />
          <h3 className="text-lg font-bold text-gray-800">{order.customerName || "Unknown"}</h3>
        </div>
        <StatusChip status={order.status} />
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center justify-between pb-1 border-b border-dashed">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-rose-500" />
            <span className="font-medium">Total Amount:</span>
          </div>
          <span className="font-bold text-xl text-rose-600">$ {order.amount.toFixed(2)}</span>
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
                <span className="text-gray-800 font-medium">{item.name}</span> -{" "}
                <span className="text-gray-500">$ {item.price.toFixed(2)} x {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-dashed">
          <Calendar size={16} className="text-gray-500" />
          <span className="font-medium">Order Date:</span>
          <span className="flex-1 text-right">{new Date(order.date).toLocaleString("en-IN")}</span>
        </div>

        {/* User Location */}
        {order.userLocation && (
          <div className="flex items-center gap-2 pt-1 border-t border-dashed">
            <MapPin size={16} className="text-rose-500" />
            <span className="text-gray-800 font-medium">Address:</span>
            <span className="flex-1 text-right">{order.userLocation.address || `${order.userLocation.latitude.toFixed(4)}, ${order.userLocation.longitude.toFixed(4)}`}</span>
            <a
              href={getDirectionsLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 bg-rose-600 text-white px-2 py-1 rounded text-xs hover:bg-rose-700 transition"
            >
              <Compass size={14} /> Directions
            </a>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t">
        <label htmlFor={`status-select-${order._id}`} className="block text-xs font-medium text-gray-500 mb-1">
          Update Status:
        </label>
        <select
          id={`status-select-${order._id}`}
          value={order.status}
          onChange={(e) => onStatusChange(order._id, e.target.value)}
          className={`w-full px-3 py-2 rounded-lg border focus:ring-rose-500 focus:border-rose-500 transition duration-150 cursor-pointer text-sm ${
            order.status === "delivered"
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

// --- MAIN COMPONENT ---
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

  // Fetch orders and attach geolocation if available
  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axios.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const ordersData: Order[] = await Promise.all(
          res.data.orders.map(async (o: any) => {
            let userLocation: { latitude: number; longitude: number; address?: string } | undefined = undefined;

            // If coordinates exist in order data, use them
            if (o.userLat && o.userLon) {
              userLocation = { latitude: o.userLat, longitude: o.userLon };

              // Optionally reverse geocode for address
              try {
                const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
                  params: {
                    format: "json",
                    lat: o.userLat,
                    lon: o.userLon,
                  },
                });
                userLocation.address = geoRes.data.display_name;
              } catch (err) {
                console.error("Reverse geocode failed", err);
              }
            }

            return {
              _id: o._id,
              date: o.date,
              items: o.items,
              amount: o.amount,
              status: o.orderStatus,
              userId: o.userId,
              customerName: o.customerName || "Unknown",
              userLocation,
            };
          })
        );

        setOrders(ordersData);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch orders.");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(`Order updated to ${newStatus}`);
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
        className={`fixed md:static z-20 bg-white shadow-md w-64 min-h-screen p-6 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <button
          className="absolute top-4 right-4 md:hidden text-gray-500 hover:text-rose-600"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={22} />
        </button>
        <h2 className="text-2xl font-bold text-rose-600 mb-8 flex items-center gap-2">Tomato</h2>
        <nav className="flex flex-col gap-3 text-gray-700">
          <Link href="/" className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer">
            <Home size={18} /> Home
          </Link>
          <Link href="/add-restaurant" className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer">
            <PlusCircle size={18} /> Add Restaurant
          </Link>
          <Link href="/menu" className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer">
            <Utensils size={18} /> Manage Menu
          </Link>
          <Link href="/orders" className="flex items-center gap-3 p-2 rounded-lg bg-rose-600 text-white cursor-pointer">
            <ShoppingBag size={18} /> Orders
          </Link>
          <Link href="/profile" className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer">
            <User size={18} /> Profile
          </Link>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); setSidebarOpen(false); }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 text-left">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 md:ml-2 transition-all duration-300">
        <button
          className="md:hidden mb-4 bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon size={18} /> Menu
        </button>

        <h1 className="text-3xl font-bold text-rose-600 flex items-center gap-2 mb-6">
          <ShoppingBag size={28} /> Order Management
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500 text-center">No orders available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}

        <ToastContainer position="top-right" autoClose={4000} />
      </main>
    </div>
  );
}
