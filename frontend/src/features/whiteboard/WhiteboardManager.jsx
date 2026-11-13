import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function WhiteboardManager({ projectId, onOpenBoard }) {
  const navigate = useNavigate();
  const [whiteboards, setWhiteboards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  const loadWhiteboards = async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`projects/${projectId}/whiteboards/`);
      setWhiteboards(res.data);
    } catch (err) {
      console.error("Failed to load project whiteboards:", err);
      setError("Failed to load whiteboards for this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWhiteboards();
  }, [projectId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    setError("");
    try {
      const res = await api.post(`projects/${projectId}/whiteboards/`, {
        title: newTitle.trim(),
      });
      setWhiteboards((prev) => [res.data, ...prev]);
      setNewTitle("");
      if (onOpenBoard) {
        onOpenBoard(res.data.id);
      } else {
        navigate(`/whiteboards/${res.data.id}`);
      }
    } catch (err) {
      console.error("Failed to create whiteboard:", err);
      setError("Could not create whiteboard.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await api.delete(`whiteboards/${id}/`);
      setWhiteboards((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Failed to delete whiteboard:", err);
      alert("Permission denied or failed to delete board.");
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Project Whiteboards</h3>
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="New whiteboard title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            disabled={creating}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            style={{
              padding: "6px 14px",
              background: "#4f46e5",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "13px",
            }}
          >
            {creating ? "Creating..." : "+ New Board"}
          </button>
        </form>
      </div>

      {error && <p style={{ color: "#ef4444", fontSize: "14px" }}>{error}</p>}

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "14px" }}>Loading whiteboards...</p>
      ) : whiteboards.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
            No whiteboards created yet for this project. Create one to start collaborating!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {whiteboards.map((b) => (
            <div
              key={b.id}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h4
                    onClick={() => {
                      if (onOpenBoard) onOpenBoard(b.id);
                      else navigate(`/whiteboards/${b.id}`);
                    }}
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "16px",
                      color: "#1e293b",
                      cursor: "pointer",
                    }}
                  >
                    🎨 {b.title}
                  </h4>
                  <button
                    onClick={() => handleDelete(b.id, b.title)}
                    title="Delete whiteboard"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <small style={{ color: "#64748b" }}>
                  Created by {b.created_by_username || "User"} •{" "}
                  {new Date(b.created_at).toLocaleDateString()}
                </small>
              </div>

              <button
                onClick={() => {
                  if (onOpenBoard) onOpenBoard(b.id);
                  else navigate(`/whiteboards/${b.id}`);
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#f1f5f9",
                  color: "#334155",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                  transition: "background 0.15s ease",
                }}
                onMouseOver={(e) => (e.target.style.background = "#e2e8f0")}
                onMouseOut={(e) => (e.target.style.background = "#f1f5f9")}
              >
                Open Whiteboard →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
