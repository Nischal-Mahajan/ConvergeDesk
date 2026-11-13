import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import CollaborativeWhiteboard from "./CollaborativeWhiteboard";
import "./whiteboard.css";

export default function WhiteboardPage() {
  const { whiteboardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Whiteboard");
  const [editingTitle, setEditingTitle] = useState(false);

  useEffect(() => {
    if (!whiteboardId) return;

    let mounted = true;
    setLoading(true);
    setError("");

    api
      .get(`whiteboards/${whiteboardId}/`)
      .then((res) => {
        if (!mounted) return;
        setBoard(res.data);
        setTitle(res.data.title || "Untitled Whiteboard");
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Failed to load whiteboard:", err);
        setError("Failed to load whiteboard metadata or access denied.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [whiteboardId]);

  const saveTitle = async (newTitle) => {
    if (!newTitle.trim() || newTitle === board?.title) {
      setEditingTitle(false);
      return;
    }
    try {
      const res = await api.patch(`whiteboards/${whiteboardId}/`, {
        title: newTitle.trim(),
      });
      setTitle(res.data.title);
      setBoard((prev) => ({ ...prev, title: res.data.title }));
    } catch (err) {
      console.error("Failed to update whiteboard title:", err);
    } finally {
      setEditingTitle(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Loading whiteboard session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Error loading whiteboard</h2>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            borderRadius: "6px",
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Navigation sub-bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 16px",
          background: "#1e293b",
          color: "#ffffff",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#e2e8f0",
              borderRadius: "4px",
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ← Back to Dashboard
          </button>
          <span>/</span>
          {editingTitle ? (
            <input
              autoFocus
              defaultValue={title}
              onBlur={(e) => saveTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle(e.target.value);
                if (e.key === "Escape") setEditingTitle(false);
              }}
              style={{
                background: "#0f172a",
                border: "1px solid #64748b",
                color: "#ffffff",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            />
          ) : (
            <strong
              onClick={() => setEditingTitle(true)}
              style={{ cursor: "pointer", textDecoration: "underline dotted" }}
              title="Click to rename"
            >
              {title} ✎
            </strong>
          )}
        </div>
        <div>
          <span style={{ color: "#94a3b8" }}>Project #{board?.project}</span>
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <CollaborativeWhiteboard
          whiteboardId={whiteboardId}
          title={title}
          onTitleChange={setTitle}
        />
      </div>
    </div>
  );
}
