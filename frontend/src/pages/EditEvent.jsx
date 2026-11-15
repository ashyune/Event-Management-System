
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getPublishedEvents, updateEvent } from "../services/eventservice";

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function EditEvent() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    capacity: "100"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadEvent = async () => {
      try {
        let event = location.state?.event;

        if (!event || String(event.id) !== String(eventId)) {
          const data = await getPublishedEvents();
          event = data.events?.find(
            (item) => String(item.id) === String(eventId)
          );
        }

        if (!event) {
          setMessage("Event not found. Please return to the events page.");
          return;
        }

        setForm({
          title: event.title || "",
          description: event.description || "",
          date: event.date || "",
          time: event.time ? event.time.slice(0, 5) : "",
          venue: event.venue || "",
          capacity: String(event.capacity ?? 100)
        });
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Unable to load event details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, location.state]);

  const handleChange = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    const capacity = Number(form.capacity);

    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      setMessage("Capacity must be a positive whole number.");
      return;
    }

    if (form.date < getToday()) {
      setMessage("Event date cannot be in the past.");
      return;
    }

    setSaving(true);

    try {
      await updateEvent(eventId, {
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        time: form.time,
        venue: form.venue.trim(),
        capacity
      });

      navigate("/events", {
        state: { message: "Event updated successfully." }
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update event."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="create-event-page">Loading event details...</main>;
  }

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
          Back to Events
        </Link>

        <h1>Edit Event</h1>
        <p>Update your event details below.</p>

        {message && <p className="error-message">{message}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Event Title</label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            maxLength={200}
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
          />

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

          <label htmlFor="time">Time</label>
          <input
            id="time"
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
          />

          <label htmlFor="venue">Venue</label>
          <input
            id="venue"
            name="venue"
            value={form.venue}
            onChange={handleChange}
            required
            maxLength={255}
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

          <button type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "Save Changes"}
          </button>

          <Link to="/events">Cancel</Link>
        </form>
      </section>
    </main>
  );
}

export default EditEvent;
