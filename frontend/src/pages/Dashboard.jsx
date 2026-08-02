import {
  Bell,
  CalendarDays,
  Clock3,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import "./Dashboard.css";

const todayAppointments = [
  {
    id: 1,
    time: "09:00",
    patient: "Ahmed Ben Salah",
    reason: "Consultation",
    status: "Confirmé",
  },
  {
    id: 2,
    time: "10:30",
    patient: "Sarra Trabelsi",
    reason: "Contrôle",
    status: "En attente",
  },
  {
    id: 3,
    time: "12:00",
    patient: "Mohamed Ali",
    reason: "Consultation",
    status: "Confirmé",
  },
  {
    id: 4,
    time: "14:30",
    patient: "Meriem Jlassi",
    reason: "Suivi",
    status: "En attente",
  },
];

function formatTodayDate() {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function Dashboard() {
  const todayDate = formatTodayDate();

  const scrollToTodayAppointments = () => {
    const appointmentsSection = document.getElementById(
      "rendez-vous-du-jour"
    );

    appointmentsSection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
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

            <div className="doctor-avatar">DA</div>

            <div className="doctor-info">
              <strong>Docteur</strong>
              <span>Administrateur</span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <div className="dashboard-welcome">
            <span className="dashboard-current-date">
              {todayDate}
            </span>

            <h1>Bienvenue sur Tabibi 👋</h1>

            <p>
              Voici un aperçu de l’activité du cabinet aujourd’hui.
            </p>
          </div>

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
                <span>Rendez-vous aujourd’hui</span>
                <strong>8</strong>
              </div>

              <ArrowRight
                className="dashboard-summary-arrow"
                size={19}
              />
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
                <strong>3</strong>
              </div>

              <ArrowRight
                className="dashboard-summary-arrow"
                size={19}
              />
            </Link>
          </div>

          <section
            className="today-appointments-section"
            id="rendez-vous-du-jour"
          >
            <div className="today-appointments-header">
              <div>
                <h2>Rendez-vous du jour</h2>

                <p>
                  Les rendez-vous programmés pour aujourd’hui
                </p>
              </div>

              <Link
                to="/rendez-vous"
                className="today-appointments-link"
              >
                Voir tous
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="today-appointments-table-wrapper">
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
                  {todayAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="appointment-time">
                          <Clock3 size={15} />
                          {appointment.time}
                        </div>
                      </td>

                      <td>
                        <strong>{appointment.patient}</strong>
                      </td>

                      <td>{appointment.reason}</td>

                      <td>
                        <span
                          className={`appointment-status ${
                            appointment.status === "Confirmé"
                              ? "confirmed"
                              : "pending"
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;