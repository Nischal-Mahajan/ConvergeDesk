import CollaborativeEditor from "./CollaborativeEditor";

export default function CollaborativeEditorTest() {
  return (
    <main style={{ padding: 24 }}>
      <h2>ConvergeDesk Collaborative Editor</h2>
      <p>Open two browser windows to test real-time editing.</p>

      <CollaborativeEditor documentId={1} />
    </main>
  );
}