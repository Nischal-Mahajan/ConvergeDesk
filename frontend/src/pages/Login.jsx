
import { useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("token/", {
        username,
        password,
      });

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      const params = new URLSearchParams(location.search);
      const next = params.get("next");

      const destination =
        next &&
        next.startsWith("/") &&
        !next.startsWith("//")
          ? next
          : "/dashboard";

      window.location.href = destination;
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Username ya password galat hai."
          : "Login nahi ho paya. Backend check karke dobara try karo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">ConvergeDesk</div>

        <p className="login-eyebrow">WELCOME BACK</p>

        <h1>Sign in to your workspace</h1>

        <p className="login-description">
          Continue collaborating with your team in one place.
        </p>

        <label htmlFor="username">Username</label>

        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Enter your username"
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="login-error">{error}</p>
        )}

        <button
          type="submit"
          className="login-button"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="login-footer">
          Your team's work, connected.
        </p>
      </form>
    </main>
  );
}

export default Login;
