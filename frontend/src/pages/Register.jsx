import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (message) setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setLoading(true);
    try {
      const data = await registerUser(form);
      setIsSuccess(true);
      setMessage(data.message || "Account created! Redirecting to login...");
      setForm({ name: "", email: "", password: "" });
      setTimeout(() => navigate("/login"), 1800);
    } catch (error) {
      setIsSuccess(false);
      setMessage(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-brand">
          <span className="auth-brand-icon">🗓️</span>
          <span className="auth-brand-name">EventHub</span>
        </div>

        <h1>Create Account</h1>
        <p>Join EventHub to discover and register for events near you.</p>

        <label htmlFor="reg-name">Full Name</label>
        <input
          id="reg-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Ashwath Rohan"
          autoComplete="name"
          required
        />

        <label htmlFor="reg-email">Email address</label>
        <input
          id="reg-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="reg-password">Password</label>
        <div className="auth-password-wrapper">
          <input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="button"
            className="auth-toggle-password"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p className="auth-hint">Must be at least 8 characters long.</p>

        {message && (
          <p className={isSuccess ? "auth-success" : "auth-error"} role="alert">
            {isSuccess ? "✓ " : "⚠ "}{message}
          </p>
        )}

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <span className="auth-spinner-row">
              <span className="auth-spinner" />
              Creating account...
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
