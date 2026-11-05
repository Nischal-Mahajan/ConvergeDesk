
import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import api from "../services/api";

function AcceptInvitation() {
  const { token } = useParams();
  const accessToken = localStorage.getItem("access_token");

  const [message, setMessage] = useState("Checking invitation...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!accessToken || !token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function acceptInvitation() {
      try {
        const response = await api.post(
          `invitations/${token}/accept/`,
          {}
        );

        if (cancelled) return;

        setMessage(
          `You joined ${response.data.workspace_name} successfully!`
        );
        setAccepted(true);
      } catch (err) {
        if (cancelled) return;

        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setError("Please sign in with the invited email account.");
        } else {
          setError(
            err.response?.data?.detail ||
              "Invitation could not be accepted."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    acceptInvitation();

    return () => {
      cancelled = true;
    };
  }, [accessToken, token]);

  if (!accessToken) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(
          `/accept-invitation/${token}`
        )}`}
        replace
      />
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">ConvergeDesk</div>
        <p className="login-eyebrow">WORKSPACE INVITATION</p>
        <h1>Join your team</h1>

        {loading && <p>{message}</p>}

        {error && <p className="login-error">{error}</p>}

        {accepted && (
          <>
            <p>{message}</p>
            <Link to="/">Go to dashboard</Link>
          </>
        )}

        {!loading && error && (
          <p>
            Make sure you are signed in using the email address
            that received this invitation.
          </p>
        )}
      </section>
    </main>
  );
}

export default AcceptInvitation;
