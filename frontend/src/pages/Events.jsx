
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublishedEvents } from "../services/eventservice";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getPublishedEvents();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Unable to load events."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <main className="events-page">
      <header className="events-header">
        <Link className="events-brand" to="/events">
          EventHub
        </Link>

        <nav className="events-nav">
          <Link to="/events">Browse Events</Link>
          <Link to="/events/create">Create Event</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <section className="events-hero">
        <p className="events-eyebrow">DISCOVER SOMETHING NEW</p>
        <h1>Find your next experience.</h1>
        <p>
          Explore upcoming events, discover new interests, and connect with
          your community.
        </p>
        <Link className="primary-link" to="/events/create">
          Create an Event
        </Link>
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
            {events.map((event) => (
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
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Events;
