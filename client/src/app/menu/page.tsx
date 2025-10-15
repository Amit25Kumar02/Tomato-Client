"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Home,
  Utensils,
  LogOut,
  PlusCircle,
  Menu as MenuIcon,
  Trash2,
  Save,
  X,
  ShoppingBag,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  name: string;
  price: number;
}

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  menu: MenuItem[];
}

export default function ManageMenuPage() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  //  Fetch restaurants belonging to this user
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
        }
      } catch (err) {
        console.error("Error parsing user data:", err);
        toast.error("Error loading user information.");
      }
    } else {
      toast.error("No user found. Please log in.");
    }
  }, []);

  const handleMenuChange = (
    rIndex: number,
    mIndex: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...restaurants];
    (updated[rIndex].menu[mIndex] as any)[field] = value;
    setRestaurants(updated);
  };

  const addMenuItem = (rIndex: number) => {
    const updated = [...restaurants];
    updated[rIndex].menu.push({ name: "", price: 0 });
    setRestaurants(updated);
  };

  const removeMenuItem = (rIndex: number, mIndex: number) => {
    const updated = [...restaurants];
    updated[rIndex].menu.splice(mIndex, 1);
    setRestaurants(updated);
  };

  const saveMenu = async (id: string, menu: MenuItem[]) => {
    try {
      await axios.put(`/api/restaurants/${id}`, { menu });
      toast.success("Menu updated successfully!");
    } catch {
      toast.error("Error updating menu");
    }
  };

  const deleteRestaurant = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant?")) return;
    try {
      await axios.delete(`/api/restaurants/${id}`);
      setRestaurants(restaurants.filter((r) => r._id !== id));
      toast.success("🗑️ Restaurant deleted");
    } catch {
      toast.error("Error deleting restaurant");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
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
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
          >
            <Home size={18} /> Home
          </Link>
          <Link
            href="/add-restaurant"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
          >
            <PlusCircle size={18} /> Add Restaurant
          </Link>
          <Link
            href="/menu"
            className="flex items-center gap-3 p-2 rounded-lg bg-rose-600 text-white cursor-pointer"
          >
            <Utensils size={18} /> Manage Menu
          </Link>
               <Link
            href="/orders"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
          >
            <ShoppingBag size={18} /> Orders
          </Link>
               <Link
            href="/profile"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 transition cursor-pointer"
          >
            <User size={18} /> Profile
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              localStorage.removeItem("token");
              window.location.href = "/login";
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
          onClick={() => setSidebarOpen(true)}
        >
          <MenuIcon size={18} />
          Menu
        </button>

        <h1 className="mt-12 md:mt-0 text-2xl md:text-3xl font-bold text-rose-600 mb-8 text-center">
          Manage Restaurant Menus
        </h1>

        <div className="space-y-6">
          {restaurants.length === 0 && (
            <p className="text-center text-gray-500">No restaurants found.</p>
          )}

          {restaurants.map((r, rIndex) => (
            <div
              key={r._id}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h2
                  className="text-xl font-semibold text-gray-800 cursor-pointer"
                  onClick={() =>
                    setExpanded(expanded === r._id ? null : r._id)
                  }
                >
                  {r.name}{" "}
                  <span className="text-sm text-gray-500">({r.cuisine})</span>
                </h2>
                <button
                  onClick={() => deleteRestaurant(r._id)}
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                  title="Delete Restaurant"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {expanded === r._id && (
                <div>
                  {r.menu.map((m, mIndex) => (
                    <div key={mIndex} className="grid md:grid-cols-3 gap-3 mb-3 items-end">
                      {/* Item Name */}
                      <div className="col-span-3">
                        <label className="text-sm text-gray-700">
                          Item Name <span className="text-rose-600">*</span>
                        </label>
                        <input
                          value={m.name}
                          onChange={(e) =>
                            handleMenuChange(rIndex, mIndex, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="input"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <label className="text-sm text-gray-700">
                          Price <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          value={m.price}
                          onChange={(e) =>
                            handleMenuChange(rIndex, mIndex, "price", Number(e.target.value))
                          }
                          placeholder="Price"
                          className="input w-full"
                        />
                      </div>

                      {/* Delete Button */}
                      <div className="flex col-span-1 justify-end">
                        <button
                          type="button"
                          onClick={() => removeMenuItem(rIndex, mIndex)}
                          className="bg-rose-500 h-12 w-12 flex items-center justify-center text-white rounded-md hover:bg-rose-600 cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add / Save Buttons */}
                  <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                    <button
                      onClick={() => addMenuItem(rIndex)}
                      className="text-sm text-rose-600 hover:text-rose-700 cursor-pointer"
                    >
                      + Add another item
                    </button>
                    <button
                      onClick={() => saveMenu(r._id, r.menu)}
                      className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 cursor-pointer"
                    >
                      <Save size={16} /> Save Menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      <ToastContainer />

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus {
          border-color: #f43f5e;
          box-shadow: 0 0 0 2px #fecdd3;
        }
      `}</style>
    </div>
  );
}

