
import { useEffect, useRef, useState } from "react";
import Quill from "quill";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { QuillBinding } from "y-quill";
import "quill/dist/quill.snow.css";

async function getFreshAccessToken() {
  let accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("Refresh token missing. Please log in again.");
  }

  let needsRefresh = true;

  if (accessToken) {
    try {
      const payload = JSON.parse(
        atob(accessToken.split(".")[1])
      );

      needsRefresh =
        !payload.exp ||
        payload.exp * 1000 < Date.now() + 60000;
    } catch {
      needsRefresh = true;
    }
  }

  if (needsRefresh) {
    const response = await fetch(
      "http://127.0.0.1:8000/api/token/refresh/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      }
    );

    if (!response.ok) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      throw new Error("Session expired. Please log in again.");
    }

    const data = await response.json();
    accessToken = data.access;

    localStorage.setItem("access_token", accessToken);

    if (data.refresh) {
      localStorage.setItem("refresh_token", data.refresh);
    }
  }

  if (!accessToken) {
    throw new Error("Access token unavailable. Please log in again.");
  }

  return accessToken;
}

export default function CollaborativeEditor({ documentId }) {
  const editorRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    if (!editorRef.current || !documentId) return;

    let disposed = false;

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: "Start writing together...",
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block"],
          ["link"],
          ["clean"],
        ],
      },
    });

    const ydoc = new Y.Doc();

    const provider = new HocuspocusProvider({
      url: "ws://localhost:1234",
      name: `convergedesk-document-${documentId}`,
      document: ydoc,
      token: getFreshAccessToken,
    });

    const ytext = ydoc.getText("quill");
    const binding = new QuillBinding(
      ytext,
      quill,
      provider.awareness
    );

    const handleStatus = ({ status }) => {
      if (disposed) return;
      console.log("Hocuspocus status:", status);
      setStatus(status);
    };

    const handleAuthFailed = (event) => {
      console.error("Hocuspocus authentication failed:", event);
    };

    const handleSynced = (event) => {
      console.log("Hocuspocus synced:", event);
    };

    const handleClose = (event) => {
      console.log("Hocuspocus connection closed:", event);
    };

    provider.on("status", handleStatus);
    provider.on("authenticationFailed", handleAuthFailed);
    provider.on("synced", handleSynced);
    provider.on("close", handleClose);

    return () => {
      disposed = true;

      provider.off("status", handleStatus);
      provider.off("authenticationFailed", handleAuthFailed);
      provider.off("synced", handleSynced);
      provider.off("close", handleClose);

      binding.destroy();
      provider.destroy();
      ydoc.destroy();

      if (editorRef.current) {
        editorRef.current.innerHTML = "";
        editorRef.current.classList.remove("ql-container");
      }
    };
  }, [documentId]);

  return (
    <section>
      <p>
        Collaboration status: <strong>{status}</strong>
      </p>
      <div ref={editorRef} />
    </section>
  );
}
