
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent } from "../services/eventservice";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function CreateEvent() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    capacity: "100",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!localStorage.getItem("token")) {
      setMessage("Please log in before creating an event.");
      return;
    }

    const capacity = Number(form.capacity);

    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      setMessage("Capacity must be a positive whole number.");
      return;
    }

    setLoading(true);

    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        venue: form.venue.trim(),
        capacity,
      });

      navigate("/events");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create event. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="create-event-page">
      <header className="events-header">
        <Link className="events-brand" to="/events">
          EventHub
        </Link>
        <nav className="events-nav">
          <Link to="/events">Browse Events</Link>
          <Link to="/events/create">Create Event</Link>
        </nav>
      </header>

      <section className="create-event-container">
        <Link className="back-link" to="/events">
          ← Back to events
        </Link>

        <div className="create-event-card">
          <p className="events-eyebrow">MAKE IT HAPPEN</p>
          <h1>Create an Event</h1>
          <p className="create-event-intro">
            Add the details below to create a new event.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="title">Event title</label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. PES Tech Fest"
              required
            />

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Tell people what the event is about"
              rows={4}
            />

            <div className="event-form-row">
              <div>
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  name="date"
                  min={getToday()}
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="time">Time</label>
                <input
                  id="time"
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label htmlFor="venue">Venue</label>
            <input
              id="venue"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="Enter event venue"
              required
            />

            <label htmlFor="capacity">Capacity</label>
            <input
              id="capacity"
              type="number"
              name="capacity"
              min="1"
              step="1"
              value={form.capacity}
              onChange={handleChange}
              required
            />

            {message && (
              <p className="message error-message">{message}</p>
            )}

            <button
              className="submit-event-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating event..." : "Create Event"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default CreateEvent;
