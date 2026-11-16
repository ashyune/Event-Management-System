
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const getPublishedEvents = async (filters = {}) => {
  const response = await API.get("/events", {
    params: filters
  });
  return response.data;
};

export const createEvent = async (eventData) => {
  const token = localStorage.getItem("token");

  const response = await API.post("/events", eventData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const updateEvent = async (eventId, eventData) => {
  const token = localStorage.getItem("token");

  const response = await API.put(`/events/${eventId}`, eventData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const getMyEvents = async () => {
  const token = localStorage.getItem("token");

  const response = await API.get("/events/mine", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
};

export const publishEvent = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await API.patch(
    `/events/${eventId}/publish`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

export const cancelEvent = async (eventId) => {
  const token = localStorage.getItem("token");

  const response = await API.patch(
    `/events/${eventId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};