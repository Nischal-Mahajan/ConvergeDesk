import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import CollaborativeEditorTest from "./CollaborativeEditorTest";
import Dashboard from "./Dashboard";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import AcceptInvitation from "./pages/AcceptInvitation";
import YjsTest from "./YjsTest";

function App() {
  const isLoggedIn = Boolean(
    localStorage.getItem("access_token")
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        <Route
          path="/accept-invitation/:token"
          element={<AcceptInvitation />}
        />

        <Route
          path="/dashboard"
          element={
            isLoggedIn
              ? <Dashboard />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/yjs-test"
          element={
            isLoggedIn
              ? <YjsTest />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/collaborative-editor-test"
          element={
            isLoggedIn
              ? <CollaborativeEditorTest />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;