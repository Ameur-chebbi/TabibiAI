import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { supabase } from "./supabase";

console.log("Supabase:", supabase);
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import RendezVous from "./pages/RendezVous";
import Patients from "./pages/Patients";
import ReponsesIA from "./pages/ReponsesIA";
import Parametres from "./pages/Parametres";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/messages"
          element={<Messages />}
        />

        <Route
          path="/rendez-vous"
          element={<RendezVous />}
        />

        <Route
          path="/patients"
          element={<Patients />}
        />

        <Route
          path="/reponses-ia"
          element={<ReponsesIA />}
        />

        <Route
          path="/parametres"
          element={<Parametres />}
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