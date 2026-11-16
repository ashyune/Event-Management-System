import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getAdminUsers,
  getAdminEvents,
  deleteAdminUser,
  cancelAdminEvent,
  getAdminAuditLogs,
} from "../services/adminService";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'events' | 'audit-logs'
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Filters & Search
  const [userSearch, setUserSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [eventStatusFilter, setEventStatusFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("");

  const [currentUserId] = useState(() => {
    try {
      const userStr = localStorage.getItem("user");
      const u = userStr ? JSON.parse(userStr) : null;
      return u?.id || null;
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  // 1. Enforce Administrator Role Guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    let parsedUser;
    try {
      const userStr = localStorage.getItem("user");
      parsedUser = userStr ? JSON.parse(userStr) : null;
    } catch {
      parsedUser = null;
    }

    if (!token || !parsedUser || parsedUser.role !== "administrator") {
      navigate("/events");
    }
  }, [navigate]);

  // 2. Fetch Data for Active Tab
  const loadTabContent = useCallback(async (tab, filterOverride = "") => {
    setLoading(true);
    setErrorMessage("");
    try {
      if (tab === "users") {
        const data = await getAdminUsers();
        setUsers(Array.isArray(data.users) ? data.users : []);
      } else if (tab === "events") {
        const data = await getAdminEvents();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } else if (tab === "audit-logs") {
        const actionParam = filterOverride !== "" ? filterOverride : auditActionFilter;
        const data = await getAdminAuditLogs(actionParam);
        setAuditLogs(Array.isArray(data.auditLogs) ? data.auditLogs : []);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login");
      } else {
        setErrorMessage(err.response?.data?.message || "Failed to load admin data.");
      }
    } finally {
      setLoading(false);
    }
  }, [auditActionFilter, navigate]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch is intentional
    void loadTabContent(activeTab);
  }, [activeTab, loadTabContent]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 3. User Deletion Action
  const handleDeleteUser = async (userId, userName) => {
    if (userId === currentUserId) {
      setErrorMessage("You cannot delete your own administrator account.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete user "${userName}" (ID: ${userId})? This action cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteAdminUser(userId);
      setSuccessMessage(`User "${userName}" deleted successfully.`);
      await loadTabContent("users");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Unable to delete user due to associated records."
      );
    }
  };

  // 4. Event Cancellation Action
  const handleCancelEvent = async (eventId, eventTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to administratively cancel "${eventTitle}"? Registration records will be preserved.`
    );
    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");
    try {
      await cancelAdminEvent(eventId);
      setSuccessMessage(`Event "${eventTitle}" has been cancelled.`);
      await loadTabContent("events");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Unable to cancel event.");
    }
  };

  // 5. Audit Log Filter Change
  const handleAuditFilterChange = (e) => {
    const action = e.target.value;
    setAuditActionFilter(action);
    void loadTabContent("audit-logs", action);
  };

  // Filtered in-memory views
  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term)
    );
  });

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.venue?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.organizer?.name?.toLowerCase().includes(eventSearch.toLowerCase());
    const matchesStatus =
      eventStatusFilter === "all" || e.status === eventStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="events-page">
      {/* Navigation Header */}
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
          <Link to="/admin" className="nav-active">
            Admin Panel
          </Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Hero Banner */}
      <section className="events-hero">
        <p className="events-eyebrow">SYSTEM ADMINISTRATION & GOVERNANCE</p>
        <h1>Administrator Dashboard</h1>
        <p>
          Oversee user accounts, monitor system events, and review verifiable audit trails.
        </p>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`filter-pill ${activeTab === "users" ? "active" : ""}`}
            onClick={() => handleTabChange("users")}
          >
            👥 User Management ({users.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === "events" ? "active" : ""}`}
            onClick={() => handleTabChange("events")}
          >
            🗓️ Event Oversight ({events.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeTab === "audit-logs" ? "active" : ""}`}
            onClick={() => handleTabChange("audit-logs")}
          >
            📜 Audit Log Viewer ({auditLogs.length})
          </button>
        </div>
      </section>

      {/* Content Section */}
      <section className="events-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Alerts */}
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

        {successMessage && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "14px 18px",
              borderRadius: "8px",
              marginBottom: "18px",
              border: "1px solid #86efac",
            }}
          >
            ✅ {successMessage}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px 0", color: "#6b7280" }}>
            Loading data, please wait...
          </p>
        ) : (
          <>
            {/* ======================================= */}
            {/* TAB 1: USERS MANAGEMENT                 */}
            {/* ======================================= */}
            {activeTab === "users" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search by name, email or role..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      width: "100%",
                      maxWidth: "380px",
                    }}
                  />
                  <span style={{ alignSelf: "center", color: "#6b7280", fontSize: "14px" }}>
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                </div>

                <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "14px 16px" }}>ID</th>
                        <th style={{ padding: "14px 16px" }}>Name</th>
                        <th style={{ padding: "14px 16px" }}>Email</th>
                        <th style={{ padding: "14px 16px" }}>Role</th>
                        <th style={{ padding: "14px 16px" }}>Registered</th>
                        <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                            No users match the search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 16px", fontWeight: "600" }}>#{u.id}</td>
                            <td style={{ padding: "12px 16px" }}>{u.name}</td>
                            <td style={{ padding: "12px 16px" }}>{u.email}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background:
                                    u.role === "administrator"
                                      ? "#f3e8ff"
                                      : u.role === "organizer"
                                      ? "#dbeafe"
                                      : "#f3f4f6",
                                  color:
                                    u.role === "administrator"
                                      ? "#6b21a8"
                                      : u.role === "organizer"
                                      ? "#1e40af"
                                      : "#374151",
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", color: "#6b7280", fontSize: "13px" }}>
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              {u.id === currentUserId ? (
                                <span style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>
                                  Current User
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u.id, u.name)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #fca5a5",
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* TAB 2: EVENTS OVERSIGHT                 */}
            {/* ======================================= */}
            {activeTab === "events" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", gap: "12px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="Search event title, venue or organizer..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid #d1d5db",
                      width: "100%",
                      maxWidth: "380px",
                    }}
                  />

                  <div style={{ display: "flex", gap: "8px" }}>
                    {["all", "published", "draft", "cancelled"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`filter-pill ${eventStatusFilter === status ? "active" : ""}`}
                        onClick={() => setEventStatusFilter(status)}
                        style={{ textTransform: "capitalize" }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "14px 16px" }}>Event</th>
                        <th style={{ padding: "14px 16px" }}>Organizer</th>
                        <th style={{ padding: "14px 16px" }}>Schedule & Venue</th>
                        <th style={{ padding: "14px 16px" }}>Capacity</th>
                        <th style={{ padding: "14px 16px" }}>Status</th>
                        <th style={{ padding: "14px 16px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                            No events match the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((evt) => (
                          <tr key={evt.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "600", color: "#111827" }}>{evt.title}</div>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>ID: #{evt.id}</div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div>{evt.organizer?.name || `Organizer #${evt.organizerId}`}</div>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>{evt.organizer?.email}</div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                              <div>📅 {evt.date} at {evt.time}</div>
                              <div style={{ color: "#6b7280" }}>📍 {evt.venue}</div>
                            </td>
                            <td style={{ padding: "12px 16px", fontWeight: "600" }}>{evt.capacity} seats</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "700",
                                  background:
                                    evt.status === "published"
                                      ? "#dcfce7"
                                      : evt.status === "draft"
                                      ? "#fef3c7"
                                      : "#fee2e2",
                                  color:
                                    evt.status === "published"
                                      ? "#166534"
                                      : evt.status === "draft"
                                      ? "#92400e"
                                      : "#991b1b",
                                }}
                              >
                                {evt.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", textAlign: "right" }}>
                              {evt.status === "cancelled" ? (
                                <span style={{ color: "#9ca3af", fontSize: "12px", fontStyle: "italic" }}>
                                  Cancelled
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCancelEvent(evt.id, evt.title)}
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #fca5a5",
                                    background: "#fee2e2",
                                    color: "#991b1b",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Cancel Event
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ======================================= */}
            {/* TAB 3: AUDIT LOG VIEWER                 */}
            {/* ======================================= */}
            {activeTab === "audit-logs" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label htmlFor="audit-filter" style={{ fontWeight: "600", fontSize: "14px" }}>
                      Filter by Action:
                    </label>
                    <select
                      id="audit-filter"
                      value={auditActionFilter}
                      onChange={handleAuditFilterChange}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #d1d5db",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">All Actions</option>
                      <option value="REGISTRATION_CREATED">REGISTRATION_CREATED</option>
                      <option value="REGISTRATION_CANCELLED">REGISTRATION_CANCELLED</option>
                      <option value="EVENT_CANCELLED">EVENT_CANCELLED</option>
                      <option value="USER_DELETED">USER_DELETED</option>
                    </select>
                  </div>

                  <span style={{ color: "#6b7280", fontSize: "14px" }}>
                    Total Records: {auditLogs.length}
                  </span>
                </div>

                <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "14px 16px" }}>Timestamp</th>
                        <th style={{ padding: "14px 16px" }}>Action</th>
                        <th style={{ padding: "14px 16px" }}>Actor</th>
                        <th style={{ padding: "14px 16px" }}>Target Entity</th>
                        <th style={{ padding: "14px 16px" }}>Context / Metadata</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#6b7280" }}>
                            No audit log entries found.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#374151" }}>
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span
                                style={{
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: log.action.includes("CANCEL")
                                    ? "#fee2e2"
                                    : log.action.includes("CREATE")
                                    ? "#dcfce7"
                                    : "#f3f4f6",
                                  color: log.action.includes("CANCEL")
                                    ? "#991b1b"
                                    : log.action.includes("CREATE")
                                    ? "#166534"
                                    : "#1f2937",
                                }}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ fontWeight: "600", fontSize: "13px" }}>
                                {log.actor?.name || `User #${log.userId}`}
                              </div>
                              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                                {log.actor?.email || `ID: ${log.userId}`}
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "13px" }}>
                              <span style={{ textTransform: "capitalize", color: "#4b5563" }}>
                                {log.entityType}
                              </span>{" "}
                              <strong>#{log.entityId}</strong>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#4b5563", maxWidth: "300px" }}>
                              {log.metadata ? (
                                <code style={{ background: "#f3f4f6", padding: "2px 6px", borderRadius: "4px" }}>
                                  {JSON.stringify(log.metadata)}
                                </code>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default AdminDashboard;
