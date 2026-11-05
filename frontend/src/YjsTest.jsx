
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export default function YjsTest() {
  const [status, setStatus] = useState("Connecting...");
  const [text, setText] = useState("");
  const docRef = useRef(null);
  const providerRef = useRef(null);
  const textRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      "convergedesk-test-room",
      doc
    );
    const sharedText = doc.getText("content");

    docRef.current = doc;
    providerRef.current = provider;
    textRef.current = sharedText;

    const onStatus = ({ status }) => setStatus(status);

    const onTextChange = () => {
      isRemoteUpdate.current = true;
      setText(sharedText.toString());

      // Keep the textarea cursor stable when remote changes arrive.
      requestAnimationFrame(() => {
        isRemoteUpdate.current = false;
      });
    };

    provider.on("status", onStatus);
    sharedText.observe(onTextChange);
    onTextChange();

    return () => {
      provider.off("status", onStatus);
      sharedText.unobserve(onTextChange);
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
      textRef.current = null;
    };
  }, []);

  function handleChange(event) {
    if (isRemoteUpdate.current) return;

    const sharedText = textRef.current;
    if (!sharedText) return;

    const newValue = event.target.value;

    // Simple prototype: replace all shared text in one transaction.
    // This verifies sync but is not conflict-free character-level editing.
    const doc = docRef.current;
    doc.transact(() => {
      sharedText.delete(0, sharedText.length);
      sharedText.insert(0, newValue);
    });
  }

  return (
    <main style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h2>ConvergeDesk Collaborative Editor</h2>

      <p>
        WebSocket status: <strong>{status}</strong>
      </p>

      <p>
        Open this same page in a second browser window.
        Both windows must use the same room.
      </p>

      <textarea
        value={text}
        onChange={handleChange}
        rows={12}
        placeholder="Start typing to test shared updates..."
        style={{
          display: "block",
          width: "100%",
          maxWidth: 900,
          padding: 12,
          fontSize: 16,
          boxSizing: "border-box",
        }}
      />
    </main>
  );
}
