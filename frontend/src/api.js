/**
 * API Service - Handles all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// =====================================================
// AUTHENTICATION API
// =====================================================

export const authAPI = {
  // Login
  login: async (username, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(response);

    // Store token in localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  // Register
  // In frontend/src/api.js
  register: async (userData) => {
    // Clean the data
    const cleanData = {
      username: userData.username.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      fullName: userData.fullName.trim(),
    };

    // Only add optional fields if they have values
    if (userData.phoneNumber?.trim()) {
      cleanData.phoneNumber = userData.phoneNumber.trim();
    }
    if (userData.organization?.trim()) {
      cleanData.organization = userData.organization.trim();
    }

    console.log("Sending:", cleanData); // Debug

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanData),
    });

    const data = await response.json();

    if (!response.ok) {
      // Show detailed validation errors
      if (data.details) {
        const errors = data.details.map((d) => d.message).join("\n");
        throw new Error(errors);
      }
      throw new Error(data.error || "Registration failed");
    }

    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};

// =====================================================
// VEHICLES API
// =====================================================

export const vehiclesAPI = {
  // Get all available vehicles
  getAvailable: async () => {
    const response = await fetch(`${API_BASE_URL}/vehicles/available`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all vehicles (admin only)
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get single vehicle
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Create vehicle (admin only)
  create: async (vehicleData) => {
    const response = await fetch(`${API_BASE_URL}/vehicles`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
  },

  // Update vehicle (admin only)
  update: async (id, vehicleData) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
  },

  // Delete vehicle (admin only)
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// BOOKINGS API
// =====================================================

export const bookingsAPI = {
  // Create booking
  create: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    return handleResponse(response);
  },

  // Get my bookings
  getMine: async () => {
    const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get all bookings (admin only)
  getAll: async (status = null) => {
    const url = status
      ? `${API_BASE_URL}/bookings?status=${status}`
      : `${API_BASE_URL}/bookings`;

    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get single booking
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Approve booking (admin only)
  approve: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Reject booking (admin only)
  reject: async (id, reason) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  // Cancel booking
  cancel: async (id) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// =====================================================
// ANALYTICS API (Admin only)
// =====================================================

export const analyticsAPI = {
  // Get dashboard summary
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get fleet statistics
  getFleetStats: async () => {
    const response = await fetch(`${API_BASE_URL}/analytics/fleet-stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Get booking trends
  getBookingTrends: async (days = 30) => {
    const response = await fetch(
      `${API_BASE_URL}/analytics/booking-trends?days=${days}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },

  // Get revenue report
  getRevenue: async (months = 12) => {
    const response = await fetch(
      `${API_BASE_URL}/analytics/revenue?months=${months}`,
      {
        headers: getAuthHeaders(),
      },
    );
    return handleResponse(response);
  },
};

// =====================================================
// HUBS API
// =====================================================

export const hubsAPI = {
  // Get all hubs
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/hubs`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};
