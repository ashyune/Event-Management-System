import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/**
 * US-15 / US-34: Fetch event participants for organizer or administrator
 * GET /api/events/:eventId/participants
 */
export const getEventParticipants = async (eventId) => {
  const token = localStorage.getItem("token");
  const response = await API.get(`/events/${eventId}/participants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
