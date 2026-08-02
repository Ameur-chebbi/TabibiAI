import { useState } from "react";
import {
  Building2,
  Check,
  Clock3,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Stethoscope,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import "./Parametres.css";

const initialSettings = {
  cabinetName: "Cabinet Tabibi",
  doctorName: "Docteur",
  phone: "+216 20 000 000",
  email: "contact@tabibi.tn",
  address: "Tunis, Tunisie",
  mapsLink: "https://maps.google.com",
  openingTime: "08:00",
  closingTime: "17:00",
  saturdayOpeningTime: "08:00",
  saturdayClosingTime: "12:00",
  mondayFriday: true,
  saturday: true,
  sunday: false,
  languages: {
    fr: true,
    en: true,
    ar: true,
    tn: true,
  },
  whatsappNotifications: true,
  appointmentNotifications: true,
  messageNotifications: true,
};

const languageOptions = [
  {
    id: "fr",
    name: "Français",
    shortName: "FR",
  },
  {
    id: "en",
    name: "English",
    shortName: "EN",
  },
  {
    id: "ar",
    name: "العربية",
    shortName: "AR",
  },
  {
    id: "tn",
    name: "Derja tunisienne",
    shortName: "TN",
  },
];

function Parametres() {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));

    setSaved(false);
  };

  const handleToggle = (name) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: !currentSettings[name],
    }));

    setSaved(false);
  };

  const handleLanguageToggle = (languageId) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      languages: {
        ...currentSettings.languages,
        [languageId]:
          !currentSettings.languages[languageId],
      },
    }));

    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  return (
    <div className="settings-page">
      <Sidebar />

      <main className="settings-main">
        <header className="settings-header">
          <div>
            <span className="settings-overline">
              Configuration
            </span>

            <h1>Paramètres du cabinet</h1>

            <p>
              Configurez les informations utilisées par Tabibi
              dans les messages automatiques et les rendez-vous.
            </p>
          </div>

          <button
            type="submit"
            form="settings-form"
            className="settings-save-button"
          >
            <Save size={19} />
            Enregistrer
          </button>
        </header>

        {saved && (
          <div className="settings-success-message">
            <Check size={18} />
            Les paramètres ont été enregistrés avec succès.
          </div>
        )}

        <form
          id="settings-form"
          className="settings-form"
          onSubmit={handleSubmit}
        >
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon blue">
                <Building2 size={21} />
              </div>

              <div>
                <h2>Informations du cabinet</h2>

                <p>
                  Ces informations seront utilisées dans les
                  réponses envoyées aux patients.
                </p>
              </div>
            </div>

            <div className="settings-grid two-columns">
              <div className="settings-form-group">
                <label htmlFor="cabinetName">
                  Nom du cabinet
                </label>

                <div className="settings-input-wrapper">
                  <Building2 size={18} />

                  <input
                    id="cabinetName"
                    name="cabinetName"
                    type="text"
                    value={settings.cabinetName}
                    onChange={handleInputChange}
                    placeholder="Nom du cabinet"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="doctorName">
                  Nom du médecin
                </label>

                <div className="settings-input-wrapper">
                  <Stethoscope size={18} />

                  <input
                    id="doctorName"
                    name="doctorName"
                    type="text"
                    value={settings.doctorName}
                    onChange={handleInputChange}
                    placeholder="Nom du médecin"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="phone">
                  Téléphone
                </label>

                <div className="settings-input-wrapper">
                  <Phone size={18} />

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={handleInputChange}
                    placeholder="+216..."
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="email">
                  Adresse e-mail
                </label>

                <div className="settings-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={settings.email}
                    onChange={handleInputChange}
                    placeholder="contact@cabinet.tn"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon purple">
                <MapPin size={21} />
              </div>

              <div>
                <h2>Adresse et localisation</h2>

                <p>
                  Ces données alimentent les variables{" "}
                  <strong>{"{{adresse}}"}</strong> et{" "}
                  <strong>{"{{lien_maps}}"}</strong>.
                </p>
              </div>
            </div>

            <div className="settings-grid">
              <div className="settings-form-group">
                <label htmlFor="address">
                  Adresse complète
                </label>

                <div className="settings-input-wrapper">
                  <MapPin size={18} />

                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={settings.address}
                    onChange={handleInputChange}
                    placeholder="Adresse du cabinet"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="mapsLink">
                  Lien Google Maps
                </label>

                <div className="settings-input-wrapper">
                  <MapPin size={18} />

                  <input
                    id="mapsLink"
                    name="mapsLink"
                    type="url"
                    value={settings.mapsLink}
                    onChange={handleInputChange}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon orange">
                <Clock3 size={21} />
              </div>

              <div>
                <h2>Horaires du cabinet</h2>

                <p>
                  Définissez les horaires affichés par le chatbot.
                </p>
              </div>
            </div>

            <div className="settings-schedule-list">
              <div className="settings-schedule-row">
                <div className="settings-schedule-day">
                  <button
                    type="button"
                    className={`settings-checkbox ${
                      settings.mondayFriday ? "active" : ""
                    }`}
                    onClick={() =>
                      handleToggle("mondayFriday")
                    }
                  >
                    {settings.mondayFriday && (
                      <Check size={15} />
                    )}
                  </button>

                  <div>
                    <strong>Lundi à vendredi</strong>
                    <span>
                      Horaires réguliers du cabinet
                    </span>
                  </div>
                </div>

                <div className="settings-time-inputs">
                  <input
                    name="openingTime"
                    type="time"
                    value={settings.openingTime}
                    onChange={handleInputChange}
                    disabled={!settings.mondayFriday}
                  />

                  <span>à</span>

                  <input
                    name="closingTime"
                    type="time"
                    value={settings.closingTime}
                    onChange={handleInputChange}
                    disabled={!settings.mondayFriday}
                  />
                </div>
              </div>

              <div className="settings-schedule-row">
                <div className="settings-schedule-day">
                  <button
                    type="button"
                    className={`settings-checkbox ${
                      settings.saturday ? "active" : ""
                    }`}
                    onClick={() => handleToggle("saturday")}
                  >
                    {settings.saturday && (
                      <Check size={15} />
                    )}
                  </button>

                  <div>
                    <strong>Samedi</strong>
                    <span>
                      Horaires du week-end
                    </span>
                  </div>
                </div>

                <div className="settings-time-inputs">
                  <input
                    name="saturdayOpeningTime"
                    type="time"
                    value={
                      settings.saturdayOpeningTime
                    }
                    onChange={handleInputChange}
                    disabled={!settings.saturday}
                  />

                  <span>à</span>

                  <input
                    name="saturdayClosingTime"
                    type="time"
                    value={
                      settings.saturdayClosingTime
                    }
                    onChange={handleInputChange}
                    disabled={!settings.saturday}
                  />
                </div>
              </div>

              <div className="settings-schedule-row">
                <div className="settings-schedule-day">
                  <button
                    type="button"
                    className={`settings-checkbox ${
                      settings.sunday ? "active" : ""
                    }`}
                    onClick={() => handleToggle("sunday")}
                  >
                    {settings.sunday && (
                      <Check size={15} />
                    )}
                  </button>

                  <div>
                    <strong>Dimanche</strong>
                    <span>
                      Cabinet fermé par défaut
                    </span>
                  </div>
                </div>

                <span className="settings-closed-badge">
                  Fermé
                </span>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon green">
                <Languages size={21} />
              </div>

              <div>
                <h2>Langues du chatbot</h2>

                <p>
                  Choisissez les langues proposées au patient
                  au début de la conversation WhatsApp.
                </p>
              </div>
            </div>

            <div className="settings-language-grid">
              {languageOptions.map((language) => (
                <button
                  key={language.id}
                  type="button"
                  className={`settings-language-card ${
                    settings.languages[language.id]
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleLanguageToggle(language.id)
                  }
                >
                  <span className="settings-language-code">
                    {language.shortName}
                  </span>

                  <span className="settings-language-name">
                    {language.name}
                  </span>

                  <span className="settings-language-check">
                    {settings.languages[language.id] && (
                      <Check size={15} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon whatsapp">
                <MessageCircle size={21} />
              </div>

              <div>
                <h2>Notifications</h2>

                <p>
                  Activez les alertes importantes liées aux
                  conversations et aux rendez-vous.
                </p>
              </div>
            </div>

            <div className="settings-toggle-list">
              <label className="settings-toggle-row">
                <div>
                  <strong>Notifications WhatsApp</strong>
                  <span>
                    Recevoir une alerte pour les nouvelles
                    conversations.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={
                    settings.whatsappNotifications
                  }
                  onChange={() =>
                    handleToggle(
                      "whatsappNotifications"
                    )
                  }
                />

                <span className="settings-switch" />
              </label>

              <label className="settings-toggle-row">
                <div>
                  <strong>
                    Demandes de rendez-vous
                  </strong>
                  <span>
                    Recevoir une alerte lorsqu'un patient
                    demande un rendez-vous.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={
                    settings.appointmentNotifications
                  }
                  onChange={() =>
                    handleToggle(
                      "appointmentNotifications"
                    )
                  }
                />

                <span className="settings-switch" />
              </label>

              <label className="settings-toggle-row">
                <div>
                  <strong>Messages non lus</strong>
                  <span>
                    Recevoir une alerte pour les messages
                    non consultés.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={
                    settings.messageNotifications
                  }
                  onChange={() =>
                    handleToggle(
                      "messageNotifications"
                    )
                  }
                />

                <span className="settings-switch" />
              </label>
            </div>
          </section>

          <div className="settings-mobile-save">
            <button
              type="submit"
              className="settings-save-button"
            >
              <Save size={19} />
              Enregistrer les paramètres
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Parametres;