import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyRegistrations, cancelRegistration } from "../services/registrationservice";

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'confirmed', 'cancelled'
  const [cancellingId, setCancellingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const navigate = useNavigate();

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      const data = await getMyRegistrations();
      setRegistrations(Array.isArray(data.registrations) ? data.registrations : []);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        setMessage(error.response?.data?.message || "Unable to load your registrations.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data fetch is intentional
    void loadRegistrations();
  }, [navigate, loadRegistrations]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCancelClick = async (registrationId, eventTitle) => {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${eventTitle}"? This will release your seat for others.`
    );
    if (!confirmed) return;

    try {
      setCancellingId(registrationId);
      setActionSuccess("");
      setMessage("");
      await cancelRegistration(registrationId);
      setActionSuccess(`Successfully cancelled registration for "${eventTitle}".`);
      await loadRegistrations();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to cancel registration.");
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === "confirmed") return reg.status === "confirmed";
    if (filter === "cancelled") return reg.status === "cancelled";
    return true;
  });

  return (
    <main className="registrations-page">
      <header className="events-header">
        <Link className="events-brand" to="/events">
          EventHub
        </Link>

        <nav className="events-nav">
          <Link to="/events">Browse Events</Link>
          <Link to="/events/create">Create Event</Link>
          <Link to="/my-registrations" className="nav-active">
            My Registrations
          </Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <section className="events-hero registrations-hero">
        <p className="events-eyebrow">YOUR ATTENDANCE PASSES</p>
        <h1>My Registrations</h1>
        <p>
          Manage your booked events, access ticket references, and track your upcoming schedule.
        </p>
        <Link className="primary-link" to="/events">
          Explore More Events
        </Link>
      </section>

      <section className="events-content registrations-content">
        <div className="registrations-toolbar">
          <div className="filter-pills">
            <button
              type="button"
              className={`filter-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({registrations.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === "confirmed" ? "active" : ""}`}
              onClick={() => setFilter("confirmed")}
            >
              Confirmed ({registrations.filter((r) => r.status === "confirmed").length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filter === "cancelled" ? "active" : ""}`}
              onClick={() => setFilter("cancelled")}
            >
              Cancelled ({registrations.filter((r) => r.status === "cancelled").length})
            </button>
          </div>
        </div>

        {actionSuccess && <p className="events-message success-message">{actionSuccess}</p>}
        {message && <p className="events-message error-message">{message}</p>}

        {loading && <p className="events-message">Loading your registrations...</p>}

        {!loading && filteredRegistrations.length === 0 && (
          <div className="events-empty">
            <h3>No registrations found</h3>
            <p>
              {filter === "all"
                ? "You haven't registered for any events yet."
                : `You have no ${filter} registrations.`}
            </p>
            <Link className="primary-link" to="/events">
              Browse Upcoming Events
            </Link>
          </div>
        )}

        {!loading && filteredRegistrations.length > 0 && (
          <div className="registrations-grid">
            {filteredRegistrations.map((reg) => {
              const event = reg.event || {};
              const isConfirmed = reg.status === "confirmed";

              return (
                <article
                  className={`registration-card ${!isConfirmed ? "registration-card-cancelled" : ""}`}
                  key={reg.id}
                >
                  <div className="registration-card-header">
                    <span
                      className={`registration-badge ${
                        isConfirmed ? "badge-confirmed" : "badge-cancelled"
                      }`}
                    >
                      {isConfirmed ? "✓ Confirmed" : "✕ Cancelled"}
                    </span>
                    <span className="registration-date">
                      Registered: {new Date(reg.registrationDate || reg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="ticket-voucher">
                    <div className="ticket-voucher-icon">🎟️</div>
                    <div className="ticket-voucher-info">
                      <span className="ticket-label">OFFICIAL PASS CODE</span>
                      <strong className="ticket-code">{reg.ticketCode}</strong>
                    </div>
                  </div>

                  <h3 className="registration-event-title">
                    {event.title || "Untitled Event"}
                  </h3>

                  <p className="event-description">
                    {event.description || "No description provided."}
                  </p>

                  <div className="event-details">
                    <p>
                      <strong>Date</strong>
                      <span>{event.date || "TBD"}</span>
                    </p>
                    <p>
                      <strong>Time</strong>
                      <span>{event.time || "To be announced"}</span>
                    </p>
                    <p>
                      <strong>Venue</strong>
                      <span>{event.venue || "TBD"}</span>
                    </p>
                  </div>

                  {isConfirmed && (
                    <div className="registration-card-actions">
                      <button
                        type="button"
                        className="btn-cancel-registration"
                        disabled={cancellingId === reg.id}
                        onClick={() => handleCancelClick(reg.id, event.title)}
                      >
                        {cancellingId === reg.id ? "Cancelling..." : "Cancel Registration"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default MyRegistrations;
