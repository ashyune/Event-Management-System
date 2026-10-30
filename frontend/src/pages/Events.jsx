import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedEvents } from "../services/eventservice";
import { registerForEvent, getMyRegistrations } from "../services/registrationservice";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [registeringId, setRegisteringId] = useState(null);
  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());
  const [successModalData, setSuccessModalData] = useState(null);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPublishedEvents();
      setEvents(Array.isArray(data.events) ? data.events : []);

      if (isLoggedIn) {
        try {
          const regData = await getMyRegistrations();
          if (Array.isArray(regData.registrations)) {
            const activeIds = new Set(
              regData.registrations
                .filter((r) => r.status === "confirmed")
                .map((r) => r.eventId)
            );
            setRegisteredEventIds(activeIds);
          }
        } catch {
          // Non-blocking if registrations fail to load
        }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load events.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleRegister = async (eventItem) => {
    if (!isLoggedIn) {
      alert("Please log in to register for events.");
      navigate("/login");
      return;
    }

    try {
      setRegisteringId(eventItem.id);
      setMessage("");

      const res = await registerForEvent(eventItem.id);

      // Add to registered list
      setRegisteredEventIds((prev) => new Set([...prev, eventItem.id]));

      // Open ticket confirmation modal
      setSuccessModalData({
        eventTitle: eventItem.title,
        ticketCode: res.ticketCode,
        date: eventItem.date,
        time: eventItem.time,
        venue: eventItem.venue,
      });
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <main className="events-page">
      <header className="events-header">
        <Link className="events-brand" to="/events">
          EventHub
        </Link>

        <nav className="events-nav">
          <Link to="/events" className="nav-active">Browse Events</Link>
          <Link to="/events/create">Create Event</Link>
          {isLoggedIn ? (
            <>
              <Link to="/my-registrations">My Registrations</Link>
              <button type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="login-nav-link">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <section className="events-hero">
        <p className="events-eyebrow">DISCOVER SOMETHING NEW</p>
        <h1>Find your next experience.</h1>
        <p>
          Explore upcoming events, discover new interests, and connect with
          your community.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" to="/events/create">
            Create an Event
          </Link>
          {isLoggedIn && (
            <Link className="secondary-link" to="/my-registrations">
              View My Bookings
            </Link>
          )}
        </div>
      </section>

      <section className="events-content">
        <div className="events-section-heading">
          <div>
            <p className="events-eyebrow">WHAT'S HAPPENING</p>
            <h2>Upcoming Events</h2>
          </div>
          <span>{events.length} {events.length === 1 ? "event" : "events"}</span>
        </div>

        {loading && <p className="events-message">Loading events...</p>}

        {!loading && message && (
          <p className="events-message error-message">{message}</p>
        )}

        {!loading && !message && events.length === 0 && (
          <div className="events-empty">
            <h3>No published events yet</h3>
            <p>Check back soon or create an event of your own.</p>
            <Link className="primary-link" to="/events/create">
              Create an Event
            </Link>
          </div>
        )}

        {!loading && !message && events.length > 0 && (
          <div className="events-grid">
            {events.map((event) => {
              const isAlreadyRegistered = registeredEventIds.has(event.id);
              const isProcessing = registeringId === event.id;

              return (
                <article className="event-card" key={event.id}>
                  <div className="event-card-top">
                    <span className="event-status">Published</span>
                    <span className="event-capacity">
                      Capacity: {event.capacity}
                    </span>
                  </div>

                  <h3>{event.title}</h3>

                  <p className="event-description">
                    {event.description || "Join us for this upcoming event."}
                  </p>

                  <div className="event-details">
                    <p>
                      <strong>Date</strong>
                      <span>{event.date}</span>
                    </p>
                    <p>
                      <strong>Time</strong>
                      <span>{event.time || "To be announced"}</span>
                    </p>
                    <p>
                      <strong>Venue</strong>
                      <span>{event.venue}</span>
                    </p>
                  </div>

                  <div className="event-card-actions">
                    {isAlreadyRegistered ? (
                      <button
                        type="button"
                        className="btn-registered"
                        onClick={() => navigate("/my-registrations")}
                      >
                        ✓ Registered (View Pass)
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-register"
                        disabled={isProcessing}
                        onClick={() => handleRegister(event)}
                      >
                        {isProcessing ? "Booking Seat..." : "Register for Event"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Ticket Confirmation Modal */}
      {successModalData && (
        <div className="modal-overlay" onClick={() => setSuccessModalData(null)}>
          <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-modal-header">
              <span className="modal-badge-success">🎉 Registration Confirmed!</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSuccessModalData(null)}
              >
                ✕
              </button>
            </div>

            <div className="ticket-modal-body">
              <h2>{successModalData.eventTitle}</h2>
              <p className="ticket-modal-sub">
                Your seat has been reserved. Please keep your official pass code handy.
              </p>

              <div className="official-pass-box">
                <span className="pass-label">OFFICIAL PASS REFERENCE</span>
                <div className="pass-code-container">
                  <span className="pass-icon">🎟️</span>
                  <strong className="pass-code">{successModalData.ticketCode}</strong>
                </div>
              </div>

              <div className="ticket-details-summary">
                <div>
                  <strong>Date:</strong> {successModalData.date}
                </div>
                <div>
                  <strong>Time:</strong> {successModalData.time || "TBD"}
                </div>
                <div>
                  <strong>Venue:</strong> {successModalData.venue}
                </div>
              </div>
            </div>

            <div className="ticket-modal-footer">
              <button
                type="button"
                className="btn-view-registrations"
                onClick={() => {
                  setSuccessModalData(null);
                  navigate("/my-registrations");
                }}
              >
                View in My Registrations →
              </button>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setSuccessModalData(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Events;
