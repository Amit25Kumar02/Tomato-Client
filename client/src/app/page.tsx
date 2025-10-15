"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Home,
  PlusCircle,
  LogOut,
  Utensils,
  Trash2,
  Edit,
  User,
  Menu as MenuIcon,
  ShoppingBag,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  rating: number;
  priceRange: string;
  address: string;
  imageUrl: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Restaurant | null>(null);
  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    rating: "",
    priceRange: "",
    address: "",
    imageUrl: "",
  });

  //  Check token before showing dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const id = parsed?.id || parsed?._id;
        if (id) {
          setUserId(id);
          fetchRestaurants(id);
        } else {
          toast.error("Invalid user data found. Please log in again.");
          router.push("/login");
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        toast.error("Error loading user information.");
        router.push("/login");
      }
    } else {
      router.push("/login");
    }
  }, [router]);

  const fetchRestaurants = async (id: string) => {
    try {
      const res = await axios.get(`/api/restaurants/nearby?userId=${id}`);
      setRestaurants(res.data.restaurants || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Error fetching your restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return toast.error("No token found. Please login.");

      await axios.delete(`/api/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRestaurants((r) => r.filter((rest) => rest._id !== id));
      toast.success("Restaurant deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting restaurant");
    }
  };

  const handleEdit = (restaurant: Restaurant) => {
    setEditing(restaurant);
    setForm({
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      rating: restaurant.rating.toString(),
      priceRange: restaurant.priceRange,
      address: restaurant.address,
      imageUrl: restaurant.imageUrl,
    });
  };

  const handleSave = async () => {
    if (!editing) return;

    const token = localStorage.getItem("token");
    if (!token) return toast.error("No token found. Please login.");

    try {
      const updated = {
        name: form.name,
        cuisine: form.cuisine,
        rating: Number(form.rating),
        priceRange: form.priceRange,
        address: form.address,
        imageUrl: form.imageUrl,
      };

      await axios.patch(`/api/restaurants/nearby/${editing._id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Restaurant updated successfully");
      setRestaurants((prev) =>
        prev.map((r) => (r._id === editing._id ? { ...r, ...updated } : r))
      );
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error("Error updating restaurant");
    }
  };

  // Optional: avoid flicker before redirect
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-20 bg-white shadow-md w-64 min-h-screen p-6 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >
        {/* Close button (only on mobile) */}
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
            className="flex items-center gap-3 p-2 rounded-lg bg-rose-600 text-white cursor-pointer"
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
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
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
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              router.push("/login");
            }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 text-left cursor-pointer"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-2 p-6 md:p-10 overflow-y-auto h-screen">
        <button
          className="fixed md:hidden mb-4 bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <MenuIcon size={18} />
          Menu
        </button>

        <div className="flex justify-between items-center mt-10 md:mt-0 mb-6">
          <h1 className="text-xl font-bold text-rose-600 md:text-2xl lg:text-4xl">
            Restaurant Dashboard
          </h1>
          <Link
            href="/add-restaurant"
            className="bg-rose-600 text-white px-2 py-2 rounded-lg hover:bg-rose-700 flex w-fit items-center gap-2 md:text-xl cursor-pointer"
          >
            <PlusCircle size={18} /> Add New
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading restaurants...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-gray-500 text-center">No restaurants added yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((r) => (
              <div
                key={r._id}
                className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 transition hover:shadow-xl"
              >
                <Image
                  src={
                    r.imageUrl ||
                    `https://placehold.co/600x400/CCE3F5/36454F?text=${encodeURIComponent(
                      r.name
                    )}`
                  }
                  alt={r.name}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/600x400/CCE3F5/36454F?text=${encodeURIComponent(
                      r.name
                    )}`;
                  }}
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {r.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-1">
                    🍜 {r.cuisine} 
                  </p>
                  <p className="text-gray-500 text-sm mb-1">
                    ⭐ {r.rating}
                  </p>
                  <p className="text-gray-500 text-sm mb-3">
                    💸 {r.priceRange}
                  </p>
                  <p className="text-gray-400 text-sm truncate">
                    📍 {r.address}
                  </p>

                  <div className="flex justify-between mt-4">
                    <button
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      onClick={() => handleEdit(r)}
                    >
                      <Edit size={16} /> Edit
                    </button>
                    <button
                      className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                      onClick={() => handleDelete(r._id)}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Form Modal */}
        {editing && (
          <div className="fixed inset-0 bg-white bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
              <h2 className="text-xl font-bold text-rose-600 mb-4">
                Edit Restaurant
              </h2>

              {/* Editable form */}
              <label className="text-sm text-gray-500 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded mb-2"
              />

              <label className="text-sm text-gray-500 mb-1 block">Cuisine</label>
              <input
                type="text"
                placeholder="Cuisine"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className="w-full border p-2 rounded mb-2"
              />

              <label className="text-sm text-gray-500 mb-1 block">Rating</label>
              <input
                type="number"
                placeholder="Rating"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="w-full border p-2 rounded mb-2"
              />

              <label className="text-sm text-gray-500 mb-1 block">Price Range</label>
              <input
                type="text"
                placeholder="Price Range"
                value={form.priceRange}
                onChange={(e) =>
                  setForm({ ...form, priceRange: e.target.value })
                }
                className="w-full border p-2 rounded mb-2"
              />

              <label className="text-sm text-gray-500 mb-1 block">Address</label>
              <input
                type="text"
                placeholder="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border p-2 rounded mb-2"
              />

              <label className="text-sm text-gray-500 mb-1 block">Image URL</label>
              <input
                type="text"
                placeholder="Image URL"
                value={form.imageUrl}
                onChange={(e) =>
                  setForm({ ...form, imageUrl: e.target.value })
                }
                className="w-full border p-2 rounded mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditing(null)}
                  className="px-3 py-2 bg-gray-200 rounded flex items-center gap-1 cursor-pointer"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-2 bg-rose-600 text-white rounded flex items-center gap-1 hover:bg-rose-700 cursor-pointer"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ToastContainer position="top-right" autoClose={4000} />
    </div>
  );
}
