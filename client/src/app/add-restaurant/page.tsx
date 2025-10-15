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
  MapPin,
  Crosshair,
  X,
  User,
  ShoppingBag,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface MenuItem {
  name: string;
  price: number;
}

export default function AddRestaurantPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([{ name: "", price: 0 }]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [useLiveLocation, setUseLiveLocation] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [restaurant, setRestaurant] = useState({
    name: "",
    cuisine: "",
    rating: "",
    priceRange: "",
    address: "",
    imageUrl: "",
    img: "",
    latitude: "",
    longitude: "",
  });

  //  Check token before showing page
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.id) {
          setUserId(parsed.id);
        } else {
          console.warn("User object missing id field");
        }
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }, [router]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestaurant({ ...restaurant, [e.target.name]: e.target.value });
  };

  // Handle menu updates
  const handleMenuChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const updated = [...menu];
    (updated[index] as any)[field] = value;
    setMenu(updated);
  };

  const addMenuItem = () => setMenu([...menu, { name: "", price: 0 }]);
  const removeMenuItem = (i: number) =>
    setMenu(menu.filter((_, idx) => idx !== i));

  // Toggle location mode
  const handleLocationMode = () => {
    if (useLiveLocation) {
      setUseLiveLocation(false);
      toast.info("Switched to manual location mode.");
    } else {
      if (!navigator.geolocation) {
        toast.error("Geolocation is not supported by your browser.");
        return;
      }

      setUseLiveLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setRestaurant((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          }));
          toast.success("Live location captured!");
        },
        (err) => {
          toast.error("Unable to fetch location. Please allow location access.");
          console.error(err);
        }
      );
    }
  };

  // Submit data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User ID not found. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/restaurants/nearby", {
        userId,
        ...restaurant,
        rating: Number(restaurant.rating),
        latitude: Number(restaurant.latitude),
        longitude: Number(restaurant.longitude),
        menu,
      });

      toast.success("Restaurant added successfully!");
      router.push("/");
      setRestaurant({
        name: "",
        cuisine: "",
        rating: "",
        priceRange: "",
        address: "",
        imageUrl: "",
        img: "",
        latitude: "",
        longitude: "",
      });
      setMenu([{ name: "", price: 0 }]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Error adding restaurant");
    } finally {
      setLoading(false);
    }
  };

  // Optional: prevent flicker before redirect
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
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-rose-100 hover:text-rose-600 cursor-pointer"
          >
            <Home size={18} /> Home
          </Link>

          <Link
            href="/add-restaurant"
            className="flex items-center gap-3 p-2 rounded-lg bg-rose-600 text-white  cursor-pointer"
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
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-rose-100 hover:text-rose-600 text-left"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-2 p-6 md:p-10 overflow-y-auto h-screen">
        {/* Mobile Menu Button */}
        <button
          className="fixed md:hidden mb-4 bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <MenuIcon size={18} />
          Menu
        </button>

        <div className="max-w-3xl mt-12 md:mt-0 mx-auto bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-rose-600 mb-8 text-center">
            🏠 Add Your Restaurant
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inputs */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 font-medium mb-2">Restaurant Name <span className="text-rose-600">*</span></label>
                <input
                  name="name"
                  value={restaurant.name}
                  onChange={handleChange}
                  placeholder="Restaurant Name"
                  className="input"
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium mb-2">Cuisine Type <span className="text-rose-600">*</span></label>
                <input
                  name="cuisine"
                  value={restaurant.cuisine}
                  onChange={handleChange}
                  placeholder="Cuisine Type"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium mb-2">Rating <span className="text-rose-600">*</span></label>
                <input
                  name="rating"
                  type="number"
                  step="0.1"
                  value={restaurant.rating}
                  onChange={handleChange}
                  placeholder="Rating (1-5)"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium mb-2">Price Range <span className="text-rose-600">*</span></label>
                <input
                  name="priceRange"
                  value={restaurant.priceRange}
                  onChange={handleChange}
                  placeholder="Price Range ($)"
                  className="input"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-700 font-medium mb-2">Address <span className="text-rose-600">*</span></label>
                <input
                  name="address"
                  value={restaurant.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 font-medium mb-2">Image URL <span className="text-rose-600">*</span></label>
                <input
                  name="imageUrl"
                  value={restaurant.imageUrl}
                  onChange={handleChange}
                  placeholder="Main Image URL"
                  className="input"
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium mb-2">Sec. Image URL <span className="text-rose-600">*</span></label>
                <input
                  name="img"
                  value={restaurant.img}
                  onChange={handleChange}
                  placeholder="Sec. Image URL"
                  className="input"
                />
              </div>
            </div>

            {/* Location */}
            {/* <div className="bg-gray-50 border border-gray-200 rounded-xl p-4"> */}
            <div className="grid md:grid-cols-2 items-center mb-3">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <MapPin size={18} /> Location
              </h2>
              <button
                type="button"
                onClick={handleLocationMode}
                className={`flex items-center w-fit cursor-pointer gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${useLiveLocation
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-rose-100 text-rose-600 hover:bg-rose-200"
                  }`}
              >
                <Crosshair size={16} />
                {useLiveLocation
                  ? "Using Live Location"
                  : "Use Live Location"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 font-medium mb-2">Latitude <span className="text-rose-600">*</span></label>
                <input
                  name="latitude"
                  type="number"
                  value={restaurant.latitude}
                  onChange={handleChange}
                  placeholder="Latitude"
                  className="input"
                  disabled={useLiveLocation}
                  required
                />
              </div>
              <div>
                <label className="text-gray-700 font-medium mb-2">Longitude <span className="text-rose-600">*</span></label>
                <input
                  name="longitude"
                  type="number"
                  value={restaurant.longitude}
                  onChange={handleChange}
                  placeholder="Longitude"
                  className="input"
                  disabled={useLiveLocation}
                  required
                />
              </div>
            </div>
            {useLiveLocation && (
              <p className="text-sm text-green-600 mt-2">
                Live location is active. Fields are auto-filled.
              </p>
            )}
            {/* </div> */}

            {/* Menu Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                🍜 Menu Items
              </h2>
              {menu.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:flex gap-3 mb-2">
                  <div>
                    <label className="text-gray-700 font-medium mb-2">Item Name<span className="text-rose-600">*</span></label>
                    <input
                      value={item.name}
                      onChange={(e) =>
                        handleMenuChange(index, "name", e.target.value)
                      }
                      placeholder="Item name"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-medium mb-2">Price<span className="text-rose-600">*</span></label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        handleMenuChange(index, "price", Number(e.target.value))
                      }
                      placeholder="Price"
                      className="input w-32"
                    />
                  </div>
                  {menu.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMenuItem(index)}
                      className="bg-rose-500 h-12 my-6 text-white px-3 rounded-md hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addMenuItem}
                className="mt-3 text-sm text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                + Add another item
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 text-white py-3 rounded-lg hover:bg-rose-700 transition-all font-semibold disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : "Save Restaurant"}
            </button>

          </form>
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
