import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
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
    setLoading(true);
    try {
      const data = await loginUser(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/events");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed. Please check your credentials.");
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

        <h1>Welcome Back</h1>
        <p>Sign in to access your events and registrations.</p>

        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label htmlFor="login-password">Password</label>
        <div className="auth-password-wrapper">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
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

        {message && (
          <p className="auth-error" role="alert">
            ⚠ {message}
          </p>
        )}

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? (
            <span className="auth-spinner-row">
              <span className="auth-spinner" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link to="/register">Create one for free</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
