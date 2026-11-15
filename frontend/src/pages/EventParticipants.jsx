import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getEventParticipants } from "../services/organizerService";

function EventParticipants() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventInfo, setEventInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'confirmed' | 'cancelled'
  const [menuOpen, setMenuOpen] = useState(false);

  // 1. Role Guard: Organizers and Administrators Only
  useEffect(() => {
    const token = localStorage.getItem("token");
    let parsedUser;
    try {
      const userStr = localStorage.getItem("user");
      parsedUser = userStr ? JSON.parse(userStr) : null;
    } catch {
      parsedUser = null;
    }

    if (
      !token ||
      !parsedUser ||
      (parsedUser.role !== "organizer" && parsedUser.role !== "administrator")
    ) {
      navigate("/events");
    }
  }, [navigate]);

  // 2. Fetch Participant List
  const loadParticipants = useCallback(async () => {
    if (!eventId) return;

    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getEventParticipants(eventId);
      setEventInfo({
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        capacity: data.capacity,
        totalParticipants: data.totalParticipants,
      });
      setParticipants(Array.isArray(data.participants) ? data.participants : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMessage(
          err.response?.data?.message ||
            "You are not authorized to view the participant list for this event."
        );
      } else if (err.response?.status === 404) {
        setErrorMessage("Event not found.");
      } else {
        setErrorMessage(
          err.response?.data?.message || "Failed to load participants."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch is intentional
    void loadParticipants();
  }, [loadParticipants]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 3. Optional CSV Export (Native Browser Blob, Zero NPM Packages)
  const handleExportCSV = () => {
    if (participants.length === 0) return;

    const headers = [
      "Registration ID",
      "User ID",
      "Name",
      "Email",
      "Ticket Code",
      "Status",
      "Registration Date",
    ];
    const rows = filteredParticipants.map((p) => [
      p.registrationId,
      p.userId,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.email.replace(/"/g, '""')}"`,
      p.ticketCode,
      p.status,
      new Date(p.registrationDate).toLocaleString(),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `event-${eventId}-attendees-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. In-Memory Search & Status Filtering
  const filteredParticipants = participants.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.ticketCode?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const cancelledCount = participants.filter((p) => p.status === "cancelled").length;

  return (
    <main className="events-page">
      {/* Header Navigation */}
      <header className="events-header">
        <Link className="events-brand" to="/events">
          EventHub
        </Link>

        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`events-nav ${menuOpen ? "events-nav--open" : ""}`}>
          <Link to="/events">Browse Events</Link>
          <Link to="/events/create">Create Event</Link>
          <Link to="/my-registrations">My Registrations</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="events-hero">
        <p className="events-eyebrow">ORGANIZER PORTAL & ATTENDEE MANAGEMENT</p>
        <h1>
          {eventInfo ? `Participants: ${eventInfo.eventTitle}` : "Event Participants"}
        </h1>
        <p>
          View verified ticket holders, monitor check-ins, and manage attendance records.
        </p>

        <div style={{ marginTop: "14px" }}>
          <Link to="/events" className="primary-link" style={{ fontSize: "14px", padding: "8px 16px" }}>
            ← Back to Events
          </Link>
        </div>
      </section>

      {/* Content Section */}
      <section className="events-content" style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px" }}>
        {errorMessage && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "18px",
              border: "1px solid #f87171",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Metrics Summary Strip */}
        {eventInfo && !loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}
          >
            <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>Total Capacity</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>{eventInfo.capacity}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ color: "#166534", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>Confirmed Attendees</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#166534", marginTop: "4px" }}>{confirmedCount}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "16px 20px", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ color: "#991b1b", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>Cancelled Registrations</div>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#991b1b", marginTop: "4px" }}>{cancelledCount}</div>
            </div>
          </div>
        )}

        {/* Toolbar: Search, Filter, Export */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <input
            type="text"
            placeholder="Search attendee by name, email or ticket code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              width: "100%",
              maxWidth: "380px",
            }}
          />

          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All ({participants.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "confirmed" ? "active" : ""}`}
              onClick={() => setStatusFilter("confirmed")}
            >
              Confirmed ({confirmedCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "cancelled" ? "active" : ""}`}
              onClick={() => setStatusFilter("cancelled")}
            >
              Cancelled ({cancelledCount})
            </button>

            {participants.length > 0 && (
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #4f46e5",
                  background: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                📥 Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
            Loading participants...
          </p>
        ) : (
          <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "14px 16px" }}>Ticket Code</th>
                  <th style={{ padding: "14px 16px" }}>Participant</th>
                  <th style={{ padding: "14px 16px" }}>Email</th>
                  <th style={{ padding: "14px 16px" }}>Registered Date</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#6b7280" }}>
                      {participants.length === 0
                        ? "No registrations recorded for this event yet."
                        : "No participants match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((p) => (
                    <tr key={p.registrationId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <code style={{ background: "#f3f4f6", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "700", color: "#1f2937" }}>
                          {p.ticketCode}
                        </code>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", color: "#111827" }}>
                        {p.name}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#4b5563" }}>
                        {p.email}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", color: "#6b7280" }}>
                        {new Date(p.registrationDate).toLocaleDateString()} at{" "}
                        {new Date(p.registrationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            background: p.status === "confirmed" ? "#dcfce7" : "#fee2e2",
                            color: p.status === "confirmed" ? "#166534" : "#991b1b",
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default EventParticipants;
