  import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  MessageCircle,
  Plus,
  Search,
  Send,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { supabase } from "../supabase";
import "./RendezVous.css";

function getConfirmationMessage(appointment) {
  if (appointment.language === "Darija") {
    return `Marhbé ${appointment.patient} 👋\nRendez-vous mte3ek tconfirmé ✅\nNstannéwek nhar ${appointment.date} m3a ${appointment.time}.`;
  }

  if (appointment.language === "العربية") {
    return `مرحباً ${appointment.patient} 👋\nتم تأكيد موعدك بنجاح ✅\nننتظرك يوم ${appointment.date} على الساعة ${appointment.time}.`;
  }

  if (appointment.language === "English") {
    return `Hello ${appointment.patient} 👋\nYour appointment has been confirmed ✅\nWe are expecting you on ${appointment.date} at ${appointment.time}.`;
  }

  return `Bonjour ${appointment.patient} 👋\nVotre rendez-vous est confirmé ✅\nNous vous attendons le ${appointment.date} à ${appointment.time}.`;
}

function getRefusalMessage(appointment) {
  if (appointment.language === "Darija") {
    return `Marhbé ${appointment.patient},\nEl créneau eli talabtou moch disponible.\nTnajem tekhtar wa9t ekher.`;
  }

  if (appointment.language === "العربية") {
    return `مرحباً ${appointment.patient}،\nنعتذر، الموعد المطلوب غير متاح.\nيمكنك اختيار توقيت آخر.`;
  }

  if (appointment.language === "English") {
    return `Hello ${appointment.patient},\nUnfortunately, the requested appointment is unavailable.\nYou can choose another time.`;
  }

  return `Bonjour ${appointment.patient},\nLe créneau demandé n’est pas disponible.\nVous pouvez choisir un autre horaire.`;
}

function getProposalMessage(appointment, newDate, newTime) {
  if (appointment.language === "Darija") {
    return `Marhbé ${appointment.patient} 👋\nEl créneau eli talabtou moch disponible.\nNnajmou n9tar7ou 3lik nhar ${newDate} m3a ${newTime}.\nT7eb tconfirmi ?`;
  }

  if (appointment.language === "العربية") {
    return `مرحباً ${appointment.patient} 👋\nالموعد المطلوب غير متاح.\nنقترح عليك يوم ${newDate} على الساعة ${newTime}.\nهل تريد التأكيد؟`;
  }

  if (appointment.language === "English") {
    return `Hello ${appointment.patient} 👋\nThe requested slot is unavailable.\nWe can offer you ${newDate} at ${newTime}.\nWould you like to confirm?`;
  }

  return `Bonjour ${appointment.patient} 👋\nLe créneau demandé n’est pas disponible.\nNous vous proposons le ${newDate} à ${newTime}.\nSouhaitez-vous confirmer ?`;
}

function RendezVous() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tous");

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [modalType, setModalType] = useState(null);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [newAppointment, setNewAppointment] = useState({
    patient: "",
    phone: "",
    date: "",
    time: "",
    reason: "",
    language: "Français",
  });

  const [notification, setNotification] = useState("");

  async function loadAppointments() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_id,
        date,
        time,
        reason,
        status,
        created_at,
        patients!patient_id (
          name,
          phone,
          language,
          source
        )
      `)
      .order("date", { ascending: true });

    console.log("Fetched appointments:", data);

    if (error) {
      console.error("Appointments error:", error);
      setErrorMessage("Impossible de charger les rendez-vous.");
      setLoading(false);
      return;
    }

    const formattedAppointments = (data || []).map((appointment) => ({
      ...appointment,
      patient: appointment.patients?.name || "Patient",
      phone: appointment.patients?.phone || "",
      language: appointment.patients?.language || "Français",
      source: appointment.patients?.source || "Manuel",
    }));

    setAppointments(formattedAppointments);
    setLoading(false);
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const patientName = String(appointment.patient || "").toLowerCase();
      const phoneValue = String(appointment.phone || "");

      const matchesSearch =
        patientName.includes(searchValue.toLowerCase()) ||
        phoneValue.includes(searchValue);

      const matchesFilter =
        activeFilter === "Tous" ||
        appointment.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [appointments, searchValue, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      pending: appointments.filter(
        (appointment) => appointment.status === "En attente"
      ).length,
      confirmed: appointments.filter(
        (appointment) => appointment.status === "Confirmé"
      ).length,
      refused: appointments.filter(
        (appointment) => appointment.status === "Refusé"
      ).length,
    };
  }, [appointments]);

  function showNotification(message) {
    setNotification(message);

    window.setTimeout(() => {
      setNotification("");
    }, 3500);
  }

  async function updateAppointmentStatus(id, newStatus) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.log("Appointment status update error:", error);
      return;
    }

    console.log("Appointment status updated:", id, newStatus);
    await loadAppointments();
  }

  function handleConfirm(appointment) {
    updateAppointmentStatus(appointment.id, "Confirmé");

    const message = getConfirmationMessage(appointment);

    showNotification(
      `Rendez-vous confirmé. Message WhatsApp simulé : ${message}`
    );
  }

  function handleRefuse(appointment) {
    updateAppointmentStatus(appointment.id, "Refusé");

    const message = getRefusalMessage(appointment);

    showNotification(
      `Rendez-vous refusé. Message WhatsApp simulé : ${message}`
    );
  }

  function openProposalModal(appointment) {
    setSelectedAppointment(appointment);
    setNewDate("");
    setNewTime("");
    setModalType("proposal");
  }

  function handleProposalSubmit(event) {
    event.preventDefault();

    if (!selectedAppointment || !newDate || !newTime) {
      return;
    }

    const message = getProposalMessage(
      selectedAppointment,
      newDate,
      newTime
    );

    updateAppointmentStatus(selectedAppointment.id, "En attente");

    showNotification(
      `Nouvel horaire proposé. Message WhatsApp simulé : ${message}`
    );

    closeModal();
  }

  function handleNewAppointmentSubmit(event) {
    event.preventDefault();

    const appointment = {
      id: Date.now(),
      patient: newAppointment.patient,
      phone: newAppointment.phone,
      date: new Date(newAppointment.date).toLocaleDateString("fr-FR"),
      time: newAppointment.time,
      reason: newAppointment.reason,
      status: "En attente",
      source: "Manuel",
      language: newAppointment.language,
    };

    setAppointments((currentAppointments) => [
      appointment,
      ...currentAppointments,
    ]);

    setNewAppointment({
      patient: "",
      phone: "",
      date: "",
      time: "",
      reason: "",
      language: "Français",
    });

    showNotification("Nouveau rendez-vous ajouté avec succès.");
    closeModal();
  }

  function closeModal() {
    setModalType(null);
    setSelectedAppointment(null);
    setNewDate("");
    setNewTime("");
  }

  return (
    <div className="rendezvous-page-layout">
      <Sidebar />

      <main className="rendezvous-main-content">
        <header className="rendezvous-header">
          <div>
            <h1>Rendez-vous</h1>

            <p>
              Gérez les demandes provenant de WhatsApp et confirmez-les
              manuellement.
            </p>
          </div>

          <button
            className="new-appointment-button"
            type="button"
            onClick={() => setModalType("new")}
          >
            <Plus size={19} />
            Nouveau rendez-vous
          </button>
        </header>

        <section className="rendezvous-stats">
          <article className="rendezvous-stat-card">
            <div className="rendezvous-stat-icon total">
              <CalendarDays size={23} />
            </div>

            <div>
              <span>Total</span>
              <strong>{stats.total}</strong>
            </div>
          </article>

          <article className="rendezvous-stat-card">
            <div className="rendezvous-stat-icon pending">
              <Clock3 size={23} />
            </div>

            <div>
              <span>En attente</span>
              <strong>{stats.pending}</strong>
            </div>
          </article>

          <article className="rendezvous-stat-card">
            <div className="rendezvous-stat-icon confirmed">
              <Check size={23} />
            </div>

            <div>
              <span>Confirmés</span>
              <strong>{stats.confirmed}</strong>
            </div>
          </article>

          <article className="rendezvous-stat-card">
            <div className="rendezvous-stat-icon refused">
              <X size={23} />
            </div>

            <div>
              <span>Refusés</span>
              <strong>{stats.refused}</strong>
            </div>
          </article>
        </section>

        <section className="rendezvous-card">
          <div className="rendezvous-toolbar">
            <div className="rendezvous-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Rechercher un patient ou un téléphone..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>

            <div className="rendezvous-filters">
              {["Tous", "En attente", "Confirmé", "Refusé"].map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={
                      activeFilter === filter
                        ? "rendezvous-filter active"
                        : "rendezvous-filter"
                    }
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="rendezvous-table-wrapper">
            <table className="rendezvous-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Motif</th>
                  <th>Langue</th>
                  <th>Source</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="no-appointments">
                        Chargement des rendez-vous...
                      </div>
                    </td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan="8">
                      <div className="no-appointments">{errorMessage}</div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>
                        <div className="rendezvous-patient-cell">
                          <div className="rendezvous-patient-avatar">
                            {appointment.patient
                              .split(" ")
                              .map((word) => word.charAt(0))
                              .slice(0, 2)
                              .join("")}
                          </div>

                          <div>
                            <strong>{appointment.patient}</strong>
                            <span>{appointment.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td>{appointment.date}</td>

                      <td>
                        <span className="rendezvous-time">
                          <Clock3 size={16} />
                          {appointment.time}
                        </span>
                      </td>

                      <td>{appointment.reason}</td>

                      <td>
                        <span className="language-badge">
                          {appointment.language}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            appointment.source === "WhatsApp"
                              ? "source-badge whatsapp"
                              : "source-badge manual"
                          }
                        >
                          {appointment.source === "WhatsApp" && (
                            <MessageCircle size={14} />
                          )}

                          {appointment.source}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`appointment-status ${appointment.status
                            .toLowerCase()
                            .replace(" ", "-")
                            .replace("é", "e")}`}
                        >
                          {appointment.status}
                        </span>
                      </td>

                      <td>
                        <div className="rendezvous-actions">
                          {appointment.status !== "Confirmé" && (
                            <button
                              type="button"
                              className="rendezvous-action confirm"
                              onClick={() => handleConfirm(appointment)}
                            >
                              <Check size={15} />
                              Confirmer
                            </button>
                          )}

                          {appointment.status !== "Refusé" && (
                            <button
                              type="button"
                              className="rendezvous-action refuse"
                              onClick={() => handleRefuse(appointment)}
                            >
                              <X size={15} />
                              Refuser
                            </button>
                          )}

                          <button
                            type="button"
                            className="rendezvous-action propose"
                            onClick={() => openProposalModal(appointment)}
                          >
                            <Clock3 size={15} />
                            Autre horaire
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {!loading && !errorMessage && filteredAppointments.length === 0 && (
                  <tr>
                    <td colSpan="8">
                      <div className="no-appointments">
                        Aucun rendez-vous trouvé.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {notification && (
        <div className="rendezvous-notification">
          <div className="rendezvous-notification-icon">
            <Send size={18} />
          </div>

          <p>{notification}</p>

          <button
            type="button"
            onClick={() => setNotification("")}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {modalType && (
        <div className="rendezvous-modal-overlay">
          <div className="rendezvous-modal">
            <div className="rendezvous-modal-header">
              <div>
                <h2>
                  {modalType === "proposal"
                    ? "Proposer un autre horaire"
                    : "Nouveau rendez-vous"}
                </h2>

                <p>
                  {modalType === "proposal"
                    ? `Patient : ${selectedAppointment?.patient}`
                    : "Ajoutez manuellement un nouveau rendez-vous."}
                </p>
              </div>

              <button
                type="button"
                className="rendezvous-modal-close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            {modalType === "proposal" ? (
              <form
                className="rendezvous-modal-form"
                onSubmit={handleProposalSubmit}
              >
                <div className="rendezvous-form-group">
                  <label htmlFor="proposal-date">Nouvelle date</label>

                  <input
                    id="proposal-date"
                    type="date"
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}
                    required
                  />
                </div>

                <div className="rendezvous-form-group">
                  <label htmlFor="proposal-time">Nouvelle heure</label>

                  <input
                    id="proposal-time"
                    type="time"
                    value={newTime}
                    onChange={(event) => setNewTime(event.target.value)}
                    required
                  />
                </div>

                <div className="rendezvous-modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-button"
                    onClick={closeModal}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="modal-submit-button"
                  >
                    <Send size={17} />
                    Envoyer la proposition
                  </button>
                </div>
              </form>
            ) : (
              <form
                className="rendezvous-modal-form"
                onSubmit={handleNewAppointmentSubmit}
              >
                <div className="rendezvous-form-group">
                  <label htmlFor="patient-name">Nom du patient</label>

                  <input
                    id="patient-name"
                    type="text"
                    placeholder="Exemple : Mohamed Ben Ali"
                    value={newAppointment.patient}
                    onChange={(event) =>
                      setNewAppointment({
                        ...newAppointment,
                        patient: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="rendezvous-form-group">
                  <label htmlFor="patient-phone">Téléphone</label>

                  <input
                    id="patient-phone"
                    type="tel"
                    placeholder="+216 00 000 000"
                    value={newAppointment.phone}
                    onChange={(event) =>
                      setNewAppointment({
                        ...newAppointment,
                        phone: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="rendezvous-form-row">
                  <div className="rendezvous-form-group">
                    <label htmlFor="appointment-date">Date</label>

                    <input
                      id="appointment-date"
                      type="date"
                      value={newAppointment.date}
                      onChange={(event) =>
                        setNewAppointment({
                          ...newAppointment,
                          date: event.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="rendezvous-form-group">
                    <label htmlFor="appointment-time">Heure</label>

                    <input
                      id="appointment-time"
                      type="time"
                      value={newAppointment.time}
                      onChange={(event) =>
                        setNewAppointment({
                          ...newAppointment,
                          time: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="rendezvous-form-group">
                  <label htmlFor="appointment-reason">Motif</label>

                  <input
                    id="appointment-reason"
                    type="text"
                    placeholder="Consultation générale..."
                    value={newAppointment.reason}
                    onChange={(event) =>
                      setNewAppointment({
                        ...newAppointment,
                        reason: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="rendezvous-form-group">
                  <label htmlFor="appointment-language">
                    Langue du patient
                  </label>

                  <select
                    id="appointment-language"
                    value={newAppointment.language}
                    onChange={(event) =>
                      setNewAppointment({
                        ...newAppointment,
                        language: event.target.value,
                      })
                    }
                  >
                    <option>Français</option>
                    <option>English</option>
                    <option>العربية</option>
                    <option>Darija</option>
                  </select>
                </div>

                <div className="rendezvous-modal-actions">
                  <button
                    type="button"
                    className="modal-cancel-button"
                    onClick={closeModal}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="modal-submit-button"
                  >
                    <Plus size={17} />
                    Ajouter
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RendezVous;