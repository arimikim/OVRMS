import React, { useState, useEffect } from "react";
import {
  Calendar,
  Car,
  Bike,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  User,
  Settings,
  Plus,
  Edit,
  Trash2,
  Search,
  Bell,
  Shield,
} from "lucide-react";

// =====================================================
// API SERVICE - All backend calls
// =====================================================
const API = {
  _headers: () => ({
    "Content-Type": "application/json",
    ...(localStorage.getItem("token") && {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    }),
  }),
  _request: async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers: API._headers() });
    const data = await res.json();
    if (!res.ok) {
      if (data.details)
        throw new Error(data.details.map((d) => d.message).join("\n"));
      throw new Error(data.error || "Request failed");
    }
    return data;
  },
  login: async (username, password) => {
    const data = await API._request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  },
  register: async (fields) => {
    const body = {
      username: fields.username,
      email: fields.email,
      password: fields.password,
      fullName: fields.fullName,
    };
    if (fields.phoneNumber?.trim())
      body.phoneNumber = fields.phoneNumber.trim();
    if (fields.organization?.trim())
      body.organization = fields.organization.trim();
    return API._request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getUser: () => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  },
  getAvailableVehicles: () => API._request("/api/vehicles/available"),
  getAllVehicles: () => API._request("/api/vehicles"),
  createVehicle: (data) =>
    API._request("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateVehicle: (id, data) =>
    API._request(`/api/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteVehicle: (id) =>
    API._request(`/api/vehicles/${id}`, { method: "DELETE" }),
  createBooking: (data) =>
    API._request("/api/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyBookings: () => API._request("/api/bookings/my-bookings"),
  getAllBookings: () => API._request("/api/bookings"),
  approveBooking: (id) =>
    API._request(`/api/bookings/${id}/approve`, { method: "POST" }),
  rejectBooking: (id, reason) =>
    API._request(`/api/bookings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getHubs: () => API._request("/api/hubs"),
  getDashboard: () => API._request("/api/analytics/dashboard"),
};

// =====================================================
// MAIN APP
// =====================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("login");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = API.getUser();
    if (savedUser && localStorage.getItem("token")) {
      setUser(savedUser);
      setView(savedUser.role === "admin" ? "admin" : "user");
    }
    setLoading(false);
  }, []);

  const handleLogin = async (username, password) => {
    const data = await API.login(username, password);
    setUser(data.user);
    setView(data.user.role === "admin" ? "admin" : "user");
  };

  const handleRegister = async (fields) => {
    await API.register(fields);
    await handleLogin(fields.username, fields.password);
  };

  const handleLogout = () => {
    API.logout();
    setUser(null);
    setView("login");
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading OVRMS...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {view === "login" && (
        <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />
      )}
      {view === "user" && <UserPortal user={user} onLogout={handleLogout} />}
      {view === "admin" && (
        <AdminDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

// =====================================================
// LOGIN SCREEN
// =====================================================
function LoginScreen({ onLogin, onRegister }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    organization: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(loginForm.username, loginForm.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!/^[a-zA-Z0-9]+$/.test(regForm.username))
        throw new Error(
          "Username: letters and numbers only, no spaces or symbols",
        );
      if (regForm.username.length < 3)
        throw new Error("Username must be at least 3 characters");
      if (regForm.password.length < 8)
        throw new Error("Password must be at least 8 characters");
      if (regForm.fullName.length < 2)
        throw new Error("Please enter your full name");
      await onRegister(regForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 mb-4 shadow-lg shadow-emerald-500/30">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            OVRMS
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Konza Technopolis Vehicle Rental
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {mode === "login" ? (
            <>
              {error && (
                <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Username
                  </label>
                  <input
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, username: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="text-right mb-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <div className="mt-5 pt-5 border-t border-slate-800">
                <p className="text-center text-sm text-slate-500">
                  No account?{" "}
                  <button
                    onClick={() => {
                      setMode("register");
                      setError("");
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    Register here
                  </button>
                </p>
                <p className="text-center text-xs text-slate-600 mt-2"></p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-5">
                Create Account
              </h2>
              {error && (
                <div className="mb-5 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                {[
                  {
                    label: "Username *",
                    key: "username",
                    type: "text",
                    ph: "Letters & numbers only",
                    hint: "Min 3 characters, no spaces or symbols",
                  },
                  {
                    label: "Full Name *",
                    key: "fullName",
                    type: "text",
                    ph: "John Doe",
                  },
                  {
                    label: "Email *",
                    key: "email",
                    type: "email",
                    ph: "john@example.com",
                  },
                  {
                    label: "Password *",
                    key: "password",
                    type: "password",
                    ph: "Min 8 characters",
                  },
                  {
                    label: "Phone (Optional)",
                    key: "phoneNumber",
                    type: "tel",
                    ph: "+254712345678",
                  },
                  {
                    label: "Organization (Optional)",
                    key: "organization",
                    type: "text",
                    ph: "KoTDA",
                  },
                ].map(({ label, key, type, ph, hint }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={regForm[key]}
                      onChange={(e) =>
                        setRegForm({ ...regForm, [key]: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                      placeholder={ph}
                      required={!label.includes("Optional")}
                    />
                    {hint && (
                      <p className="mt-1 text-xs text-slate-500">{hint}</p>
                    )}
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Register"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm text-slate-500">
                Have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// USER PORTAL
// =====================================================
function UserPortal({ user, onLogout }) {
  const [tab, setTab] = useState("browse");
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [bookingVehicle, setBookingVehicle] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, b, h] = await Promise.all([
        API.getAvailableVehicles(),
        API.getMyBookings(),
        API.getHubs(),
      ]);
      setVehicles(v);
      setBookings(b);
      setHubs(h);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchType = filterType === "all" || v.vehicle_type === filterType;
    const matchSearch =
      v.vehicle_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.plate_number?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">OVRMS</p>
              <p className="text-slate-500 text-xs">User Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg text-sm text-slate-300">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              {user.fullName || user.username}
            </span>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2">
          {[
            ["browse", "Browse Vehicles"],
            ["bookings", `My Bookings (${bookings.length})`],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === k ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && <Spinner text="Loading vehicles..." />}
        {error && <ErrorBox message={error} onRetry={loadData} />}

        {!loading && !error && tab === "browse" && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vehicles..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
                />
              </div>
              <div className="flex gap-2">
                {[
                  ["all", "All"],
                  ["car", "🚗 Cars"],
                  ["bike", "🚲 Bikes"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${filterType === val ? "bg-emerald-500 text-white" : "bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <Empty
                icon={<Car className="w-12 h-12 text-slate-600" />}
                message="No vehicles available"
                sub="Admin needs to add vehicles first"
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((v) => (
                  <VehicleCard
                    key={v.vehicle_id}
                    vehicle={v}
                    onBook={() => setBookingVehicle(v)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && tab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <Empty
                icon={<Calendar className="w-12 h-12 text-slate-600" />}
                message="No bookings yet"
                sub="Browse vehicles and make your first booking"
              >
                <button
                  onClick={() => setTab("browse")}
                  className="mt-4 px-5 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-all"
                >
                  Browse Vehicles
                </button>
              </Empty>
            ) : (
              bookings.map((b) => (
                <BookingCard key={b.booking_id} booking={b} />
              ))
            )}
          </div>
        )}
      </main>

      {bookingVehicle && (
        <BookingModal
          vehicle={bookingVehicle}
          hubs={hubs}
          onClose={() => setBookingVehicle(null)}
          onSuccess={() => {
            setBookingVehicle(null);
            loadData();
            setTab("bookings");
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// ADMIN DASHBOARD
// =====================================================
function AdminDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("pending");
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [vehicleModal, setVehicleModal] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [v, b, h, s] = await Promise.all([
        API.getAllVehicles(),
        API.getAllBookings(),
        API.getHubs(),
        API.getDashboard(),
      ]);
      setVehicles(v.data || v);
      setBookings(b);
      setHubs(h);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.approveBooking(id);
      await loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (!reason?.trim()) return;
    try {
      await API.rejectBooking(id, reason);
      await loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!confirm("Delete this vehicle?")) return;
    try {
      await API.deleteVehicle(id);
      await loadData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const pending = bookings.filter((b) => b.booking_status === "pending");
  const approved = bookings.filter((b) => b.booking_status === "approved");
  const active = bookings.filter((b) => b.booking_status === "active");
  const overdue = bookings.filter((b) => b.is_overdue);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">OVRMS Admin</p>
              <p className="text-slate-500 text-xs">Operations Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {overdue.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
                <Bell className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 text-xs font-medium">
                  {overdue.length} Overdue
                </span>
              </div>
            )}
            <span className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-lg text-sm text-slate-300">
              <User className="w-3.5 h-3.5 text-orange-400" />
              {user.fullName || user.username}
            </span>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-6xl mx-auto px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Pending",
              value: stats?.bookings?.pending ?? pending.length,
              color: "yellow",
            },
            {
              label: "Active Rentals",
              value: stats?.bookings?.active ?? active.length,
              color: "blue",
            },
            {
              label: "Total Fleet",
              value: stats?.fleet?.total ?? vehicles.length,
              color: "green",
            },
            {
              label: "Overdue",
              value: stats?.bookings?.overdue ?? overdue.length,
              color: "red",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className={`p-3 rounded-xl border ${
                color === "yellow"
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : color === "blue"
                    ? "bg-blue-500/10 border-blue-500/20"
                    : color === "green"
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <p className="text-xs text-slate-400">{label}</p>
              <p
                className={`text-2xl font-bold mt-0.5 ${
                  color === "yellow"
                    ? "text-yellow-400"
                    : color === "blue"
                      ? "text-blue-400"
                      : color === "green"
                        ? "text-emerald-400"
                        : "text-red-400"
                }`}
              >
                {value ?? 0}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto">
          {[
            ["pending", `Pending (${pending.length})`],
            ["approved", `Approved (${approved.length})`],
            ["active", `Active (${active.length})`],
            ["fleet", "Fleet Management"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === k ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading && <Spinner text="Loading dashboard..." color="orange" />}
        {error && <ErrorBox message={error} onRetry={loadData} />}

        {!loading && !error && (
          <>
            {tab === "pending" && (
              <div className="space-y-4">
                {pending.length === 0 ? (
                  <Empty
                    icon={<CheckCircle className="w-12 h-12 text-slate-600" />}
                    message="No pending requests"
                  />
                ) : (
                  pending.map((b) => (
                    <AdminBookingCard
                      key={b.booking_id}
                      booking={b}
                      onApprove={() => handleApprove(b.booking_id)}
                      onReject={() => handleReject(b.booking_id)}
                    />
                  ))
                )}
              </div>
            )}
            {tab === "approved" && (
              <div className="space-y-4">
                {approved.length === 0 ? (
                  <Empty
                    icon={<Calendar className="w-12 h-12 text-slate-600" />}
                    message="No approved bookings"
                  />
                ) : (
                  approved.map((b) => (
                    <BookingCard key={b.booking_id} booking={b} isAdmin />
                  ))
                )}
              </div>
            )}
            {tab === "active" && (
              <div className="space-y-4">
                {active.length === 0 ? (
                  <Empty
                    icon={<Car className="w-12 h-12 text-slate-600" />}
                    message="No active rentals"
                  />
                ) : (
                  active.map((b) => (
                    <BookingCard
                      key={b.booking_id}
                      booking={b}
                      isAdmin
                      showOverdue
                    />
                  ))
                )}
              </div>
            )}
            {tab === "fleet" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Fleet Management
                  </h2>
                  <button
                    onClick={() => setVehicleModal("add")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Vehicle
                  </button>
                </div>
                {vehicles.length === 0 ? (
                  <Empty
                    icon={<Car className="w-12 h-12 text-slate-600" />}
                    message="No vehicles yet"
                    sub="Add your first vehicle!"
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {vehicles.map((v) => (
                      <AdminVehicleCard
                        key={v.vehicle_id}
                        vehicle={v}
                        onEdit={() => setVehicleModal(v)}
                        onDelete={() => handleDeleteVehicle(v.vehicle_id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {vehicleModal && (
        <VehicleModal
          vehicle={vehicleModal === "add" ? null : vehicleModal}
          hubs={hubs}
          onClose={() => setVehicleModal(null)}
          onSuccess={() => {
            setVehicleModal(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// =====================================================
// SHARED COMPONENTS
// =====================================================
function VehicleCard({ vehicle, onBook }) {
  return (
    <div className="group bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          {vehicle.vehicle_type === "car" ? (
            <Car className="w-5 h-5 text-emerald-400" />
          ) : (
            <Bike className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/25">
          Available
        </span>
      </div>
      <h3 className="text-white font-semibold mb-0.5">
        {vehicle.vehicle_name}
      </h3>
      <p className="text-slate-500 text-sm mb-3">{vehicle.plate_number}</p>
      <div className="space-y-1.5 mb-4 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          {vehicle.hub_name}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-emerald-400 font-semibold">
            Ksh {vehicle.daily_rate}/day
          </span>
        </div>
      </div>
      <button
        onClick={onBook}
        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-md hover:shadow-emerald-500/30 transition-all group-hover:-translate-y-0.5"
      >
        Book Now
      </button>
    </div>
  );
}

function AdminVehicleCard({ vehicle, onEdit, onDelete }) {
  const statusStyles = {
    available: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    rented: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    maintenance: "bg-orange-500/15 text-orange-400 border-orange-500/25",
    damaged: "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          {vehicle.vehicle_type === "car" ? (
            <Car className="w-5 h-5 text-emerald-400" />
          ) : (
            <Bike className="w-5 h-5 text-cyan-400" />
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h3 className="text-white font-semibold mb-0.5">
        {vehicle.vehicle_name}
      </h3>
      <p className="text-slate-500 text-sm mb-3">{vehicle.plate_number}</p>
      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${statusStyles[vehicle.vehicle_status] || statusStyles.available}`}
        >
          {vehicle.vehicle_status}
        </span>
        <span className="text-emerald-400 text-sm font-semibold">
          Ksh {vehicle.daily_rate}/day
        </span>
      </div>
    </div>
  );
}

function BookingCard({ booking, isAdmin, showOverdue }) {
  const statusStyles = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    approved: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    rejected: "bg-red-500/15 text-red-400 border-red-500/25",
    completed: "bg-slate-500/15 text-slate-400 border-slate-500/25",
    cancelled: "bg-red-500/15 text-red-400 border-red-500/25",
  };
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{booking.vehicle_name}</h3>
          {isAdmin && (
            <p className="text-slate-400 text-sm">{booking.user_name}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <span
            className={`px-2.5 py-1 text-xs font-medium rounded-full border capitalize ${statusStyles[booking.booking_status] || statusStyles.pending}`}
          >
            {booking.booking_status}
          </span>
          {showOverdue && booking.is_overdue && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
              Overdue
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          Pickup: {booking.pickup_hub_name}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          Dropoff: {booking.dropoff_hub_name}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          From: {booking.requested_start_date?.split("T")[0]}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
          To: {booking.requested_end_date?.split("T")[0]}
        </div>
      </div>
      {booking.estimated_cost && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 text-sm text-emerald-400 font-semibold">
          Estimated: Ksh {parseFloat(booking.estimated_cost).toLocaleString()}
        </div>
      )}
    </div>
  );
}

function AdminBookingCard({ booking, onApprove, onReject }) {
  return (
    <div className="bg-slate-800/30 border border-yellow-500/20 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">{booking.vehicle_name}</h3>
          <p className="text-slate-400 text-sm">{booking.user_name}</p>
        </div>
        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
          Pending
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Pickup: {booking.pickup_hub_name}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Dropoff: {booking.dropoff_hub_name}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          {booking.requested_start_date?.split("T")[0]}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" />
          {booking.requested_end_date?.split("T")[0]}
        </div>
      </div>
      {booking.estimated_cost && (
        <p className="text-sm text-emerald-400 font-semibold mb-4">
          Cost: Ksh {parseFloat(booking.estimated_cost).toLocaleString()}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <CheckCircle className="w-4 h-4" /> Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <XCircle className="w-4 h-4" /> Reject
        </button>
      </div>
    </div>
  );
}

function BookingModal({ vehicle, hubs, onClose, onSuccess }) {
  const [form, setForm] = useState({
    pickupHubId: "",
    dropoffHubId: "",
    startDate: "",
    endDate: "",
    purpose: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pickupHubId || !form.dropoffHubId) {
      setError("Please select both hubs");
      return;
    }
    if (form.endDate < form.startDate) {
      setError("End date must be after start date");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await API.createBooking({
        vehicleId: vehicle.vehicle_id,
        pickupHubId: form.pickupHubId,
        dropoffHubId: form.dropoffHubId,
        requestedStartDate: form.startDate,
        requestedEndDate: form.endDate,
        purposeOfRental: form.purpose,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Book Vehicle</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center">
            {vehicle.vehicle_type === "car" ? (
              <Car className="w-5 h-5 text-emerald-400" />
            ) : (
              <Bike className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {vehicle.vehicle_name}
            </p>
            <p className="text-slate-400 text-xs">
              {vehicle.plate_number} • Ksh {vehicle.daily_rate}/day
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            ["Pickup Hub", "pickupHubId"],
            ["Dropoff Hub", "dropoffHubId"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
              <select
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              >
                <option value="">Select hub...</option>
                {hubs.map((h) => (
                  <option key={h.hub_id} value={h.hub_id}>
                    {h.hub_name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {[
            ["Start Date", "startDate"],
            ["End Date", "endDate"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
              <input
                type="date"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                min={today}
                required
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Purpose (Optional)
            </label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Site visit"
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800/60 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-700/60 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VehicleModal({ vehicle, hubs, onClose, onSuccess }) {
  const [form, setForm] = useState(
    vehicle
      ? {
          vehicleType: vehicle.vehicle_type,
          vehicleName: vehicle.vehicle_name,
          plateNumber: vehicle.plate_number,
          currentHubId: vehicle.current_hub_id || vehicle.hub_id || "",
          dailyRate: vehicle.daily_rate,
          vehicleMake: vehicle.vehicle_make || "",
          vehicleModel: vehicle.vehicle_model || "",
          color: vehicle.color || "",
        }
      : {
          vehicleType: "car",
          vehicleName: "",
          plateNumber: "",
          currentHubId: "",
          dailyRate: "",
          vehicleMake: "",
          vehicleModel: "",
          color: "",
        },
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { ...form, dailyRate: parseFloat(form.dailyRate) };
      vehicle
        ? await API.updateVehicle(vehicle.vehicle_id, payload)
        : await API.createVehicle(payload);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">
            {vehicle ? "Edit Vehicle" : "Add Vehicle"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Vehicle Type
            </label>
            <select
              value={form.vehicleType}
              onChange={(e) =>
                setForm({ ...form, vehicleType: e.target.value })
              }
              required
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>
          {[
            ["Vehicle Name *", "vehicleName", "text", "e.g. Toyota Corolla"],
            ["Plate Number *", "plateNumber", "text", "e.g. KCA 001A"],
            ["Daily Rate (Ksh) *", "dailyRate", "number", "500"],
            ["Make (Optional)", "vehicleMake", "text", "Toyota"],
            ["Model (Optional)", "vehicleModel", "text", "Corolla"],
            ["Color (Optional)", "color", "text", "Silver"],
          ].map(([label, key, type, ph]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={ph}
                required={!label.includes("Optional")}
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Mobility Hub *
            </label>
            <select
              value={form.currentHubId}
              onChange={(e) =>
                setForm({ ...form, currentHubId: e.target.value })
              }
              required
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            >
              <option value="">Select hub...</option>
              {hubs.map((h) => (
                <option key={h.hub_id} value={h.hub_id}>
                  {h.hub_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800/60 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-700/60 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : vehicle ? "Update" : "Add Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// UTILITY COMPONENTS
// =====================================================
function Spinner({ text, color = "emerald" }) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div
          className={`w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${color === "orange" ? "border-orange-500" : "border-emerald-500"}`}
        />
        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 mb-6">
      <p className="font-medium">Error: {message}</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function Empty({ icon, message, sub, children }) {
  return (
    <div className="text-center py-20 bg-slate-800/20 rounded-2xl border border-slate-700/30">
      <div className="flex justify-center mb-4 opacity-40">{icon}</div>
      <p className="text-slate-400 font-medium">{message}</p>
      {sub && <p className="text-slate-600 text-sm mt-1">{sub}</p>}
      {children}
    </div>
  );
}
