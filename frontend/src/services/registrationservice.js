import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const registerForEvent = async (eventId) => {
  const token = localStorage.getItem("token");
  const response = await API.post(
    "/registrations",
    { eventId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getMyRegistrations = async () => {
  const token = localStorage.getItem("token");
  const response = await API.get("/registrations/my-registrations", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const cancelRegistration = async (registrationId) => {
  const token = localStorage.getItem("token");
  const response = await API.patch(
    `/registrations/${registrationId}/cancel`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getEventRegistrationStatus = async (eventId) => {
  const token = localStorage.getItem("token");
  const response = await API.get(`/registrations/event/${eventId}/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

