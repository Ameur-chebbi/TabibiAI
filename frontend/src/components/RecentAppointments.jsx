function RecentAppointments() {
  const appointments = [
    {
      id: 1,
      patient: "Ahmed Ben Ali",
      date: "Aujourd’hui",
      time: "09:00",
      status: "Confirmé",
    },
    {
      id: 2,
      patient: "Meriem Trabelsi",
      date: "Aujourd’hui",
      time: "14:30",
      status: "En attente",
    },
    {
      id: 3,
      patient: "Mohamed Gharbi",
      date: "Demain",
      time: "10:00",
      status: "Confirmé",
    },
  ];

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Rendez-vous récents</h2>
          <p>Prochains rendez-vous enregistrés</p>
        </div>

        <button type="button" className="panel-link">
          Voir tout
        </button>
      </div>

      <div className="appointments-list">
        {appointments.map((appointment) => (
          <article className="appointment-item" key={appointment.id}>
            <div className="appointment-date">
              <strong>{appointment.time}</strong>
              <span>{appointment.date}</span>
            </div>

            <div className="appointment-info">
              <strong>{appointment.patient}</strong>
              <span
                className={`appointment-status ${
                  appointment.status === "Confirmé"
                    ? "status-confirmed"
                    : "status-pending"
                }`}
              >
                {appointment.status}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecentAppointments;