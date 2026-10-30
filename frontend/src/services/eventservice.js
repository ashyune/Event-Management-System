
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getPublishedEvents = async () => {
  const response = await API.get("/events");
  return response.data;
};

export const createEvent = async (eventData) => {
  const token = localStorage.getItem("token");

  const response = await API.post("/events", eventData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
