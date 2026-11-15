import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/**
 * US-14 / US-32: Fetch all registered users (Admin only)
 */
export const getAdminUsers = async () => {
  const token = localStorage.getItem("token");
  const response = await API.get("/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * US-14 / US-32: Fetch all events across all statuses with organizer details
 */
export const getAdminEvents = async () => {
  const token = localStorage.getItem("token");
  const response = await API.get("/admin/events", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * US-14 / US-32: Safely delete a user without dependencies
 */
export const deleteAdminUser = async (userId) => {
  const token = localStorage.getItem("token");
  const response = await API.delete(`/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * US-14 / US-32: Administrative override to cancel an event
 */
export const cancelAdminEvent = async (eventId) => {
  const token = localStorage.getItem("token");
  const response = await API.delete(`/admin/events/${eventId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * US-36: Fetch system audit logs with optional action filter
 */
export const getAdminAuditLogs = async (action = "") => {
  const token = localStorage.getItem("token");
  const query = action ? `?action=${encodeURIComponent(action)}` : "";
  const response = await API.get(`/admin/audit-logs${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
