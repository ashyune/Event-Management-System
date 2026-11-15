
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import MyRegistrations from "./pages/MyRegistrations";
import AdminDashboard from "./pages/AdminDashboard";
import EventParticipants from "./pages/EventParticipants";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/events" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/events/edit/:eventId" element={<EditEvent />} />
        <Route path="/my-registrations" element={<MyRegistrations />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/events/:eventId/participants" element={<EventParticipants />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
