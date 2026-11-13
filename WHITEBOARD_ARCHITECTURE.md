# ConvergeDesk — Real-Time Collaborative Whiteboard Architecture

**Feature Owner:** Divyam  
**Target Branch:** `feature/collaborative-whiteboard`  
**Reference Spec:** `ConvergeDesk_Divyam_Collaborative_Whiteboard_Specification.md`

---

## 1. High-Level Architecture Overview

ConvergeDesk's Collaborative Whiteboard unifies real-time collaborative vector drawing with server-side access control, conflict-free state resolution, and durable database persistence.

```
+-------------------------------------------------------------------------------+
|                                  BROWSER (React + Konva)                      |
|                                                                               |
|   +-----------------------+     +-------------------+     +---------------+   |
|   | CollaborativeCanvas   | <-> |   Y.Doc / Y.Map   | <-> | Y.UndoManager |   |
|   | (Shapes, Pen, Cursors)|     | (Shared Objects)  |     | (Local Undo)  |   |
|   +-----------------------+     +-------------------+     +---------------+   |
|                                           ^                                   |
|                                           | Yjs Protocol via WebSocket        |
+-------------------------------------------|-----------------------------------+
                                            v
+-------------------------------------------------------------------------------+
|                       HOCUSPOCUS COLLABORATION SERVER (Node.js)               |
|                                                                               |
|   - Room name: convergedesk-whiteboard-{id}                                   |
|   - onAuthenticate: calls Django API with Bearer token                        |
|   - onLoadDocument: queries PostgreSQL for existing binary state              |
|   - onStoreDocument: persists merged Yjs state binary update into PostgreSQL  |
|   - Awareness API: broadcasts live cursors & collaborator metadata            |
+-------------------------------------------------------------------------------+
         |                                                       |
         | Verify JWT & Project Membership                       | Debounced SQL
         v                                                       v
+-----------------------------+                         +-----------------------+
|  DJANGO BACKEND (DRF)       |                         |  POSTGRESQL DATABASE  |
|                             |                         |                       |
|  - /api/projects/:id/boards |                         |  - core_whiteboard    |
|  - /api/whiteboards/:id/    |                         |  - core_whiteboard-   |
|  - /api/collaboration/      |                         |    state (bytea)      |
|    whiteboards/:id/authorize|                         |                       |
+-----------------------------+                         +-----------------------+
```

---

## 2. Real-Time Synchronization (Yjs CRDT)

1. **Shared Object Model:**
   - Whiteboard elements are stored in a Yjs `Y.Map` named `whiteboard-objects`.
   - Each element has a unique, deterministic ID and schema:
     ```json
     {
       "id": "1731502400000-a1b2c3",
       "type": "rectangle | ellipse | pen | eraser | arrow | line | text",
       "x": 120,
       "y": 80,
       "width": 200,
       "height": 100,
       "points": [0, 0, 50, 50],
       "color": "#625cf0",
       "strokeWidth": 3,
       "createdBy": "divyam"
     }
     ```
2. **Conflict Resolution:**
   - Yjs CRDT guarantees state convergence across concurrent edits without data loss.
3. **Collaborative Undo/Redo:**
   - `Y.UndoManager` scopes mutations to the local client's changes, ensuring that an undo action never rolls back a peer's concurrent drawings.
4. **Live Presence & Cursors:**
   - Presence uses Yjs `Awareness` (ephemeral WebSocket messages).
   - Coordinates are broadcast at throttled intervals and rendered on an overlay Konva layer.
   - Awareness states are never saved to the database.

---

## 3. Persistence Strategy & Recovery

1. **Snapshot & State Vector Accumulation:**
   - On initial room connection, the Hocuspocus collaboration server executes `onLoadDocument`.
   - If an existing binary state exists in PostgreSQL (`core_whiteboardstate.state`), it is decoded and applied via `Y.applyUpdate(document, state)`.
2. **Debounced Saves:**
   - When mutations occur, `onStoreDocument` captures `Y.encodeStateAsUpdate(document)` and updates `core_whiteboardstate` using `UPSERT` (`INSERT ... ON CONFLICT DO UPDATE`).
   - If updates arrive during a save, Yjs ensures no state vectors are dropped.

---

## 4. Security & Permissions

1. **Authentication:**
   - The WebSocket connection passes the user's JWT access token via `@hocuspocus/provider`.
   - Before admitting the connection, the collaboration server queries:
     `GET /api/collaboration/whiteboards/{whiteboardId}/authorize/`
     passing the user's `Bearer` token.
2. **Authorization & Access Control:**
   - Django validates that the requesting user is an active member of the workspace and project containing the whiteboard.
   - Requests from non-members or unauthenticated users return `401 Unauthorized` or `404/403 Forbidden`, immediately terminating the WebSocket handshake.
3. **Mutation & Deletion:**
   - Whiteboard deletion is guarded server-side: only the whiteboard creator, workspace owner, or workspace admin may delete a board.

---

## 5. Environment Variables & Setup

### Collaboration Server (`collaboration-server/.env`):
```env
PORT=1234
DJANGO_API_URL=http://127.0.0.1:8000/api
DB_HOST=localhost
DB_PORT=5432
DB_NAME=convergedesk
DB_USER=postgres
DB_PASSWORD=your_password
```

### Backend (`backend/.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=convergedesk
DB_USER=postgres
DB_PASSWORD=your_password
SECRET_KEY=your_django_secret
```

### Running the Services:
1. **Backend:**
   ```bash
   cd backend
   python manage.py migrate
   python manage.py runserver
   ```
2. **Collaboration Server:**
   ```bash
   cd collaboration-server
   npm install
   node server.js
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
