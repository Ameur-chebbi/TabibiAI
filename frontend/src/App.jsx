import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import RendezVous from "./pages/RendezVous";
import Patients from "./pages/Patients";
import ReponsesIA from "./pages/ReponsesIA";
import Parametres from "./pages/Parametres";

/**
 * Checks for a live Supabase session before rendering a protected page.
 * - While the session is loading  → blank screen (avoids flash of content).
 * - Session absent / expired      → redirect to /login.
 * - Session valid                 → render the requested page.
 */
function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    // Get the current session immediately
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    // Keep in sync if the user signs out in another tab
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // loading — render nothing yet
  if (session === null) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />

        <Route
          path="/messages"
          element={<ProtectedRoute><Messages /></ProtectedRoute>}
        />

        <Route
          path="/rendez-vous"
          element={<ProtectedRoute><RendezVous /></ProtectedRoute>}
        />

        <Route
          path="/patients"
          element={<ProtectedRoute><Patients /></ProtectedRoute>}
        />

        <Route
          path="/reponses-ia"
          element={<ProtectedRoute><ReponsesIA /></ProtectedRoute>}
        />

        <Route
          path="/parametres"
          element={<ProtectedRoute><Parametres /></ProtectedRoute>}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;