import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyEvents,
  publishEvent,
  cancelEvent,
} from "../services/eventservice";

function OrganizerDashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const data = await getMyEvents();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to load your events."
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        navigate("/events");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    let user = {};

    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = {};
    }

    if (!token || user.role !== "organizer") {
      navigate("/events");
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- asynchronous data loading
    void loadEvents();
  }, [navigate, loadEvents]);

  const handlePublish = async (event) => {
    if (!window.confirm(`Publish "${event.title}"?`)) {
      return;
    }

    try {
      setProcessingId(event.id);
      setErrorMessage("");
      setSuccessMessage("");

      await publishEvent(event.id);

      setSuccessMessage(`"${event.title}" has been published.`);
      await loadEvents();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to publish event."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"?`)) {
      return;
    }

    try {
      setProcessingId(event.id);
      setErrorMessage("");
      setSuccessMessage("");

      await cancelEvent(event.id);

      setSuccessMessage(`"${event.title}" has been cancelled.`);
      await loadEvents();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Unable to cancel event."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const statusStyle = (status) => {
    if (status === "published") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "draft") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#fee2e2",
      color: "#991b1b",
    };
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
          <Link to="/organizer">My Events</Link>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </header>

      <section
        style={{
          maxWidth: "1200px",
          margin: "40px auto",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <p className="events-eyebrow">ORGANIZER WORKSPACE</p>
            <h1>My Events</h1>
            <p>Manage your drafts and published events.</p>
          </div>

          <Link className="primary-link" to="/events/create">
            + Create Event
          </Link>
        </div>

        {errorMessage && (
          <p className="events-message error-message">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="events-message">
            {successMessage}
          </p>
        )}

        {loading ? (
          <p className="events-message">Loading your events...</p>
        ) : events.length === 0 ? (
          <div className="events-empty">
            <h3>You haven't created any events yet</h3>
            <p>Your events will appear here after you create them.</p>
            <Link className="primary-link" to="/events/create">
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#ffffff",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                  {["Event", "Date", "Venue", "Capacity", "Status", "Actions"].map(
                    (heading) => (
                      <th key={heading} style={{ padding: "14px" }}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {events.map((event) => {
                  const isProcessing = processingId === event.id;

                  return (
                    <tr
                      key={event.id}
                      style={{ borderTop: "1px solid #e5e7eb" }}
                    >
                      <td style={{ padding: "14px", fontWeight: "600" }}>
                        {event.title}
                      </td>

                      <td style={{ padding: "14px" }}>
                        {event.date}
                        <br />
                        <small>{event.time}</small>
                      </td>

                      <td style={{ padding: "14px" }}>
                        {event.venue}
                      </td>

                      <td style={{ padding: "14px" }}>
                        {event.capacity}
                      </td>

                      <td style={{ padding: "14px" }}>
                        <span
                          style={{
                            ...statusStyle(event.status),
                            padding: "5px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: "700",
                            textTransform: "capitalize",
                          }}
                        >
                          {event.status}
                        </span>
                      </td>

                      <td style={{ padding: "14px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {event.status !== "cancelled" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                navigate(`/events/edit/${event.id}`, {
                                  state: { event },
                                })
                              }
                            >
                              Edit
                            </button>
                          )}

                          {event.status === "draft" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handlePublish(event)}
                            >
                              {isProcessing ? "Please wait..." : "Publish"}
                            </button>
                          )}

                          {event.status !== "cancelled" && (
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleCancel(event)}
                            >
                              {isProcessing ? "Please wait..." : "Cancel"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default OrganizerDashboard;