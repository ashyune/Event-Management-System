import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getSummaryReport, getEventReport } from "../services/reportService";

function Reports() {
  const navigate = useNavigate();

  const [userRole] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u)?.role : null;
    } catch {
      return null;
    }
  });

  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'published' | 'draft' | 'cancelled'
  const [menuOpen, setMenuOpen] = useState(false);

  // 1. Enforce Role Protection: Administrator and Organizer Only
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
      (parsedUser.role !== "administrator" && parsedUser.role !== "organizer")
    ) {
      navigate("/events");
    }
  }, [navigate]);

  // 2. Fetch Reports Data (Summary + Detailed Events)
  const loadReports = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const [summaryData, eventsData] = await Promise.all([
        getSummaryReport(),
        getEventReport(),
      ]);
      setSummary(summaryData);
      setEvents(Array.isArray(eventsData.events) ? eventsData.events : []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      } else {
        setErrorMessage(
          err.response?.data?.message || "Failed to load report analytics."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch is intentional
    void loadReports();
  }, [loadReports]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 3. Filter Event-Wise Reports
  const filteredEvents = events.filter((ev) => {
    const term = eventSearch.toLowerCase();
    const matchesSearch =
      ev.title?.toLowerCase().includes(term) ||
      ev.venue?.toLowerCase().includes(term) ||
      ev.organizer?.name?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "all" || ev.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const isAdmin = userRole === "administrator";
  const fillRate = summary?.registrationStats?.overallFillRatePercent || 0;

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
          {isAdmin && <Link to="/admin">Admin Panel</Link>}
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="events-hero">
        <p className="events-eyebrow">
          {isAdmin
            ? "EXECUTIVE ANALYTICS & SYSTEM REPORTING"
            : "ORGANIZER PERFORMANCE & ATTENDANCE METRICS"}
        </p>
        <h1>
          {isAdmin ? "Global System Reports" : "Organizer Analytics"}
        </h1>
        <p>
          {isAdmin
            ? "Comprehensive overview of users, event capacity, ticket allocations, and system-wide fill rates."
            : "Real-time metrics, capacity utilization, and attendance tracking across your hosted events."}
        </p>
        <div style={{ marginTop: "14px" }}>
          <button
            type="button"
            className="filter-pill active"
            onClick={loadReports}
            style={{ fontSize: "13px", padding: "6px 14px", cursor: "pointer" }}
          >
            🔄 Refresh Data
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <section
        className="events-content"
        style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}
      >
        {errorMessage && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #f87171",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
            Generating comprehensive reports and metrics...
          </p>
        ) : (
          <>
            {/* Top Metrics Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {/* Metric 1: Capacity Fill Rate */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "18px 20px",
                  borderRadius: "10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  borderTop: "4px solid #4f46e5",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                  Overall Fill Rate
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#4f46e5", marginTop: "4px" }}>
                  {fillRate}%
                </div>
                {/* Visual Progress Bar */}
                <div style={{ background: "#e5e7eb", borderRadius: "6px", height: "8px", marginTop: "10px", overflow: "hidden" }}>
                  <div
                    style={{
                      background: fillRate >= 80 ? "#16a34a" : fillRate >= 50 ? "#4f46e5" : "#eab308",
                      width: `${Math.min(100, Math.max(0, fillRate))}%`,
                      height: "100%",
                      borderRadius: "6px",
                      transition: "width 0.4s ease-in-out",
                    }}
                  />
                </div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "6px" }}>
                  {summary?.registrationStats?.publishedConfirmedRegistrations || 0} /{" "}
                  {summary?.registrationStats?.totalCapacityOffered || 0} published seats filled
                </div>
              </div>

              {/* Metric 2: Total Events */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "18px 20px",
                  borderRadius: "10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  borderTop: "4px solid #0ea5e9",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                  Events Breakdown
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>
                  {summary?.eventStats?.totalEvents || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px", display: "flex", gap: "10px" }}>
                  <span style={{ color: "#166534" }}>
                    ● {summary?.eventStats?.publishedEvents || 0} Published
                  </span>
                  <span style={{ color: "#d97706" }}>
                    ● {summary?.eventStats?.draftEvents || 0} Draft
                  </span>
                  <span style={{ color: "#991b1b" }}>
                    ● {summary?.eventStats?.cancelledEvents || 0} Cancelled
                  </span>
                </div>
              </div>

              {/* Metric 3: Total Registrations */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "18px 20px",
                  borderRadius: "10px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                  borderTop: "4px solid #16a34a",
                }}
              >
                <div style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                  Registration Activity
                </div>
                <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>
                  {summary?.registrationStats?.totalRegistrations || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px", display: "flex", gap: "12px" }}>
                  <span>
                    ✓ <strong>{summary?.registrationStats?.confirmedRegistrations || 0}</strong> Confirmed
                  </span>
                  <span>
                    ✗ <strong>{summary?.registrationStats?.cancelledRegistrations || 0}</strong> Cancelled
                  </span>
                </div>
              </div>

              {/* Metric 4 (Admin Only): Global Users Breakdown */}
              {isAdmin && summary?.userStats && (
                <div
                  style={{
                    background: "#ffffff",
                    padding: "18px 20px",
                    borderRadius: "10px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    borderTop: "4px solid #8b5cf6",
                  }}
                >
                  <div style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                    Total Users
                  </div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: "#8b5cf6", marginTop: "4px" }}>
                    {summary.userStats.totalUsers}
                  </div>
                  <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "8px" }}>
                    {summary.userStats.totalParticipants} Participants |{" "}
                    {summary.userStats.totalOrganizers} Organizers |{" "}
                    {summary.userStats.totalAdmins} Admins
                  </div>
                </div>
              )}
            </div>

            {/* Event-Wise Detailed Report Section */}
            <div style={{ background: "#ffffff", borderRadius: "10px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: 0 }}>
                    Event-Wise Occupancy & Attendance Report
                  </h2>
                  <p style={{ fontSize: "13px", color: "#6b7280", margin: "4px 0 0 0" }}>
                    Per-event breakdown showing confirmed seats, capacity utilization, and remaining spots.
                  </p>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search by title, venue or organizer..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      border: "1px solid #d1d5db",
                      fontSize: "13px",
                      minWidth: "260px",
                    }}
                  />

                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All ({events.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "published" ? "active" : ""}`}
                    onClick={() => setStatusFilter("published")}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "draft" ? "active" : ""}`}
                    onClick={() => setStatusFilter("draft")}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "cancelled" ? "active" : ""}`}
                    onClick={() => setStatusFilter("cancelled")}
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              {/* Event Report Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "12px 14px" }}>Event</th>
                      <th style={{ padding: "12px 14px" }}>Date & Time</th>
                      <th style={{ padding: "12px 14px" }}>Status</th>
                      {isAdmin && <th style={{ padding: "12px 14px" }}>Organizer</th>}
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Capacity</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Confirmed</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Spots Left</th>
                      <th style={{ padding: "12px 14px", textAlign: "center" }}>Occupancy</th>
                      <th style={{ padding: "12px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isAdmin ? 9 : 8}
                          style={{ padding: "30px", textAlign: "center", color: "#6b7280" }}
                        >
                          {events.length === 0
                            ? "No events found in this scope."
                            : "No events match your filter criteria."}
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((ev) => {
                        const statusColors = {
                          published: { bg: "#dcfce7", text: "#166534" },
                          draft: { bg: "#fef3c7", text: "#92400e" },
                          cancelled: { bg: "#fee2e2", text: "#991b1b" },
                        };
                        const color = statusColors[ev.status] || { bg: "#f3f4f6", text: "#374151" };

                        return (
                          <tr key={ev.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: "700", color: "#111827" }}>{ev.title}</div>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>📍 {ev.venue || "TBA"}</div>
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#4b5563" }}>
                              <div>{ev.date}</div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>{ev.time}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background: color.bg,
                                  color: color.text,
                                }}
                              >
                                {ev.status}
                              </span>
                            </td>
                            {isAdmin && (
                              <td style={{ padding: "12px 14px", fontSize: "13px" }}>
                                {ev.organizer?.name ? (
                                  <div>
                                    <div style={{ fontWeight: "600", color: "#1f2937" }}>
                                      {ev.organizer.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                      {ev.organizer.email}
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: "#9ca3af" }}>—</span>
                                )}
                              </td>
                            )}
                            <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: "600" }}>
                              {ev.capacity}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right", color: "#166534", fontWeight: "700" }}>
                              {ev.confirmedRegistrations}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right", color: ev.spotsRemaining === 0 ? "#dc2626" : "#4b5563", fontWeight: "600" }}>
                              {ev.spotsRemaining}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <span
                                style={{
                                  padding: "2px 8px",
                                  borderRadius: "10px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background:
                                    ev.occupancyPercent >= 100
                                      ? "#fef2f2"
                                      : ev.occupancyPercent >= 75
                                      ? "#eff6ff"
                                      : "#f9fafb",
                                  color:
                                    ev.occupancyPercent >= 100
                                      ? "#b91c1c"
                                      : ev.occupancyPercent >= 75
                                      ? "#1d4ed8"
                                      : "#374151",
                                  border: "1px solid #e5e7eb",
                                }}
                              >
                                {ev.occupancyPercent}%
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "right" }}>
                              <Link
                                to={`/events/${ev.id}/participants`}
                                style={{
                                  fontSize: "12px",
                                  color: "#4f46e5",
                                  fontWeight: "600",
                                  textDecoration: "none",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid #c7d2fe",
                                  background: "#eef2ff",
                                }}
                              >
                                Attendees →
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Reports;
