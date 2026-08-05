import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { supabase } from "../supabase";
import Sidebar from "../components/Sidebar";
import RecentAppointments from "../components/RecentAppointments";
import RecentMessages from "../components/RecentMessages";
import "./Dashboard.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTodayDate() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

/** Returns today's date as a YYYY-MM-DD string (local time, not UTC). */
function localISODate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Derives two uppercase initials from an email address or full name. */
function getInitials(text = "") {
  const parts = text.trim().split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (text.slice(0, 2) || "?").toUpperCase();
}

// ─── component ───────────────────────────────────────────────────────────────

function Dashboard() {
  const todayDate = formatTodayDate();

  // ── auth user
  const [userEmail, setUserEmail] = useState("");

  // ── summary counters
  const [todayCount, setTodayCount] = useState(null);
  const [pendingCount, setPendingCount] = useState(null);

  // ── today's appointments table
  const [todayAppointments, setTodayAppointments] = useState([]);

  // ── side panels (passed as props to child components)
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);

  // ── ui state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── data fetching ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError("");

      try {
        const today = localISODate();

        // Run all independent queries in parallel
        const [
          userResult,
          todayResult,
          pendingResult,
          recentRdvResult,
          recentMsgResult,
        ] = await Promise.all([
          // 1. Auth user info
          supabase.auth.getUser(),

          // 2. Today's appointments (full rows for the table)
          supabase
            .from("appointments")
            .select(`
              id,
              time,
              reason,
              status,
              patients!patient_id ( name )
            `)
            .eq("date", today)
            .order("time", { ascending: true }),

          // 3. Pending appointments count (any date)
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("status", "En attente"),

          // 4. Next 3 upcoming appointments for the side panel
          supabase
            .from("appointments")
            .select(`
              id,
              date,
              time,
              reason,
              status,
              patients!patient_id ( name )
            `)
            .gte("date", today)
            .order("date", { ascending: true })
            .order("time", { ascending: true })
            .limit(3),

          // 5. Last 3 conversations for the side panel
          supabase
            .from("conversations")
            .select(`
              id,
              message,
              created_at,
              patients!patient_id ( name )
            `)
            .eq("sender", "patient")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        if (cancelled) return;

        // Collect errors
        const queryError =
          todayResult.error ||
          pendingResult.error ||
          recentRdvResult.error ||
          recentMsgResult.error;

        if (queryError) {
          console.error("Dashboard fetch error:", queryError);
          setError("Impossible de charger les données du tableau de bord.");
          setLoading(false);
          return;
        }

        // Auth user
        const user = userResult.data?.user;
        setUserEmail(user?.email || "");

        // Today's appointments table rows
        setTodayAppointments(
          (todayResult.data || []).map((row) => ({
            id: row.id,
            time: row.time?.slice(0, 5) ?? "—", // "HH:MM"
            patient: row.patients?.name ?? "—",
            reason: row.reason ?? "—",
            status: row.status ?? "En attente",
          }))
        );

        // Summary counters
        setTodayCount((todayResult.data || []).length);
        setPendingCount(pendingResult.count ?? 0);

        // Side-panel: recent appointments
        setRecentAppointments(
          (recentRdvResult.data || []).map((row) => ({
            id: row.id,
            patient: row.patients?.name ?? "—",
            date: row.date ?? "—",
            time: row.time?.slice(0, 5) ?? "—",
            status: row.status ?? "En attente",
          }))
        );

        // Side-panel: recent messages
        setRecentMessages(
          (recentMsgResult.data || []).map((row) => ({
            id: row.id,
            name: row.patients?.name ?? "—",
            message: row.message ?? "",
            createdAt: row.created_at,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          console.error("Dashboard unexpected error:", err);
          setError("Une erreur inattendue s'est produite.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // ── derived display values ─────────────────────────────────────────────────
  const initials = getInitials(userEmail);
  const emailPrefix = userEmail.split("@")[0] || "Docteur";
  // Capitalise the email prefix as a display name fallback
  const displayName =
    emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  // ── handlers ──────────────────────────────────────────────────────────────
  function scrollToTodayAppointments() {
    document
      .getElementById("rendez-vous-du-jour")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {/* ── Topbar ── */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-spacer" />

          <div className="dashboard-user-area">
            <button
              className="notification-button"
              type="button"
              aria-label="Notifications"
            >
              <Bell size={21} />
            </button>

            <div className="doctor-avatar" aria-hidden="true">
              {loading ? "…" : initials}
            </div>

            <div className="doctor-info">
              <strong>Docteur</strong>
              <span>{loading ? "…" : displayName}</span>
            </div>
          </div>
        </header>

        {/* ── Main content ── */}
        <section className="dashboard-content">
          {/* Welcome */}
          <div className="dashboard-welcome">
            <span className="dashboard-current-date">{todayDate}</span>
            <h1>Bienvenue sur Tabibi 👋</h1>
            <p>Voici un aperçu de l'activité du cabinet aujourd'hui.</p>
          </div>

          {/* Global error banner */}
          {error && (
            <p className="dashboard-error-banner" role="alert">
              {error}
            </p>
          )}

          {/* Summary cards */}
          <div className="dashboard-today-summary">
            <button
              className="dashboard-summary-card dashboard-summary-button"
              type="button"
              onClick={scrollToTodayAppointments}
            >
              <div className="dashboard-summary-icon appointments">
                <CalendarDays size={22} />
              </div>

              <div className="dashboard-summary-content">
                <span>Rendez-vous aujourd'hui</span>
                <strong>
                  {loading ? (
                    <span className="dashboard-skeleton-inline" />
                  ) : (
                    todayCount ?? 0
                  )}
                </strong>
              </div>

              <ArrowRight className="dashboard-summary-arrow" size={19} />
            </button>

            <Link
              to="/rendez-vous"
              className="dashboard-summary-card dashboard-summary-link"
            >
              <div className="dashboard-summary-icon pending">
                <AlertCircle size={22} />
              </div>

              <div className="dashboard-summary-content">
                <span>Demandes en attente</span>
                <strong>
                  {loading ? (
                    <span className="dashboard-skeleton-inline" />
                  ) : (
                    pendingCount ?? 0
                  )}
                </strong>
              </div>

              <ArrowRight className="dashboard-summary-arrow" size={19} />
            </Link>
          </div>

          {/* Today's appointments table */}
          <section
            className="today-appointments-section"
            id="rendez-vous-du-jour"
          >
            <div className="today-appointments-header">
              <div>
                <h2>Rendez-vous du jour</h2>
                <p>Les rendez-vous programmés pour aujourd'hui</p>
              </div>

              <Link to="/rendez-vous" className="today-appointments-link">
                Voir tous
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="today-appointments-table-wrapper">
              {loading ? (
                <div className="dashboard-loading-rows">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="dashboard-skeleton-row" />
                  ))}
                </div>
              ) : todayAppointments.length === 0 ? (
                <p className="dashboard-empty-state">
                  Aucun rendez-vous prévu aujourd'hui.
                </p>
              ) : (
                <table className="today-appointments-table">
                  <thead>
                    <tr>
                      <th>Heure</th>
                      <th>Patient</th>
                      <th>Motif</th>
                      <th>Statut</th>
                    </tr>
                  </thead>

                  <tbody>
                    {todayAppointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>
                          <div className="appointment-time">
                            <Clock3 size={15} />
                            {appt.time}
                          </div>
                        </td>

                        <td>
                          <strong>{appt.patient}</strong>
                        </td>

                        <td>{appt.reason}</td>

                        <td>
                          <span
                            className={`appointment-status ${
                              appt.status === "Confirmé"
                                ? "confirmed"
                                : "pending"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Side panels */}
          <div className="dashboard-panels">
            <RecentAppointments
              appointments={recentAppointments}
              loading={loading}
            />
            <RecentMessages
              messages={recentMessages}
              loading={loading}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
