export { default as CollaborativeWhiteboard } from "./CollaborativeWhiteboard";
export { default as WhiteboardPage } from "./WhiteboardPage";
export { default as WhiteboardManager } from "./WhiteboardManager";

// Standalone panel component suitable for embedding in the 4-panel resizable layout
export function WhiteboardPanel({ whiteboardId, title }) {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <CollaborativeWhiteboard
        whiteboardId={whiteboardId}
        title={title}
        isPanel={true}
      />
    </div>
  );
}
