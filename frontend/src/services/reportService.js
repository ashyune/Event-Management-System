import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/**
 * US-33: Fetch summary metrics report (Admin global, Organizer scoped)
 * GET /api/reports/summary
 */
export const getSummaryReport = async () => {
  const token = localStorage.getItem("token");
  const response = await API.get("/reports/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * US-33: Fetch detailed event occupancy and attendance report
 * GET /api/reports/events
 */
export const getEventReport = async () => {
  const token = localStorage.getItem("token");
  const response = await API.get("/reports/events", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
