import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Formats a YYYY-MM-DD date string into a readable French label.
 * Returns "Aujourd'hui", "Demain", or "DD/MM/YYYY".
 */
function formatDateLabel(dateStr) {
  if (!dateStr) return "—";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Parse as local date (YYYY-MM-DD) to avoid UTC offset shifting the day
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (date.getTime() === today.getTime()) return "Aujourd'hui";
  if (date.getTime() === tomorrow.getTime()) return "Demain";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Props
 * ─────
 * appointments : Array<{
 *   id      : string | number
 *   patient : string        — patient name
 *   date    : string        — "YYYY-MM-DD"
 *   time    : string        — "HH:MM"
 *   status  : string        — e.g. "Confirmé" | "En attente"
 * }>
 * loading : boolean
 */
function RecentAppointments({ appointments = [], loading = false }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Rendez-vous à venir</h2>
          <p>Prochains rendez-vous enregistrés</p>
        </div>

        <Link to="/rendez-vous" className="panel-link">
          Voir tout
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="appointments-list">
        {loading ? (
          /* Skeleton rows while fetching */
          [1, 2, 3].map((n) => (
            <div key={n} className="appointment-item appointment-item--skeleton">
              <div className="skeleton-block skeleton-time" />
              <div className="skeleton-block skeleton-name" />
            </div>
          ))
        ) : appointments.length === 0 ? (
          <p className="panel-empty-state">Aucun rendez-vous à venir.</p>
        ) : (
          appointments.map((appt) => (
            <article className="appointment-item" key={appt.id}>
              <div className="appointment-date">
                <strong>{appt.time}</strong>
                <span>{formatDateLabel(appt.date)}</span>
              </div>

              <div className="appointment-info">
                <strong>{appt.patient}</strong>
                <span
                  className={`appointment-status ${
                    appt.status === "Confirmé"
                      ? "status-confirmed"
                      : "status-pending"
                  }`}
                >
                  {appt.status}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default RecentAppointments;
