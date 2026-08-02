import { useMemo, useState } from "react";
import {
  Bot,
  CalendarCheck,
  Check,
  Clock3,
  Edit3,
  FileText,
  Languages,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import "./ReponsesIA.css";

const languageOptions = [
  {
    id: "fr",
    label: "Français",
    shortLabel: "FR",
    direction: "ltr",
  },
  {
    id: "en",
    label: "English",
    shortLabel: "EN",
    direction: "ltr",
  },
  {
    id: "ar",
    label: "العربية",
    shortLabel: "AR",
    direction: "rtl",
  },
  {
    id: "tn",
    label: "Derja tunisienne",
    shortLabel: "TN",
    direction: "ltr",
  },
];

const categories = [
  "Toutes",
  "Rendez-vous",
  "Horaires",
  "Adresse",
  "Contact",
  "Documents",
  "Général",
];

const categoryIcons = {
  "Rendez-vous": CalendarCheck,
  Horaires: Clock3,
  Adresse: MapPin,
  Contact: Phone,
  Documents: FileText,
  Général: MessageCircle,
};

const initialResponses = [
  {
    id: 1,
    title: "Confirmation de rendez-vous",
    category: "Rendez-vous",
    active: true,
    contents: {
      fr: "Bonjour {{nom}}, votre rendez-vous est confirmé pour le {{date}} à {{heure}}.",
      en: "Hello {{nom}}, your appointment is confirmed for {{date}} at {{heure}}.",
      ar: "مرحبًا {{nom}}، تم تأكيد موعدك يوم {{date}} على الساعة {{heure}}.",
      tn: "Aslema {{nom}}, rendez-vous mte3ek confirmé nhar {{date}} m3a {{heure}}.",
    },
  },
  {
    id: 2,
    title: "Rappel de rendez-vous",
    category: "Rendez-vous",
    active: true,
    contents: {
      fr: "Bonjour {{nom}}, nous vous rappelons votre rendez-vous prévu demain à {{heure}}.",
      en: "Hello {{nom}}, this is a reminder for your appointment tomorrow at {{heure}}.",
      ar: "مرحبًا {{nom}}، نذكّرك بموعدك غدًا على الساعة {{heure}}.",
      tn: "Aslema {{nom}}, nذكروك eli 3andek rendez-vous ghodwa m3a {{heure}}.",
    },
  },
  {
    id: 3,
    title: "Horaires du cabinet",
    category: "Horaires",
    active: true,
    contents: {
      fr: "Le cabinet est ouvert du lundi au vendredi de 08:00 à 17:00 et le samedi de 08:00 à 12:00.",
      en: "The clinic is open Monday to Friday from 08:00 to 17:00 and Saturday from 08:00 to 12:00.",
      ar: "العيادة مفتوحة من الاثنين إلى الجمعة من الساعة 08:00 إلى 17:00، ويوم السبت من 08:00 إلى 12:00.",
      tn: "El cabinet ma7loul mel ithnin lel jem3a men 08:00 lel 17:00, w sebt men 08:00 lel 12:00.",
    },
  },
  {
    id: 4,
    title: "Adresse du cabinet",
    category: "Adresse",
    active: true,
    contents: {
      fr: "Notre cabinet se trouve à l’adresse suivante : {{adresse}}. Voici le lien Google Maps : {{lien_maps}}.",
      en: "Our clinic is located at: {{adresse}}. Google Maps link: {{lien_maps}}.",
      ar: "تقع العيادة في العنوان التالي: {{adresse}}. رابط Google Maps: {{lien_maps}}.",
      tn: "El cabinet mawjoud fi: {{adresse}}. Heka lien Google Maps: {{lien_maps}}.",
    },
  },
  {
    id: 5,
    title: "Demande reçue",
    category: "Général",
    active: true,
    contents: {
      fr: "Bonjour {{nom}}, votre demande a bien été reçue. Notre équipe vous répondra prochainement.",
      en: "Hello {{nom}}, your request has been received. Our team will reply shortly.",
      ar: "مرحبًا {{nom}}، تم استلام طلبك. سيتواصل معك فريقنا قريبًا.",
      tn: "Aslema {{nom}}, talbek wselna. El équipe bech تجاوبك قريب.",
    },
  },
  {
    id: 6,
    title: "Créneau indisponible",
    category: "Rendez-vous",
    active: true,
    contents: {
      fr: "Bonjour {{nom}}, le créneau demandé n’est pas disponible. Merci de choisir un autre horaire.",
      en: "Hello {{nom}}, the requested time slot is unavailable. Please choose another time.",
      ar: "مرحبًا {{nom}}، التوقيت المطلوب غير متوفر. يرجى اختيار توقيت آخر.",
      tn: "Aslema {{nom}}, el wa9t elli اخترتو moch disponible. Ikhtar wa9t ekher.",
    },
  },
  {
    id: 7,
    title: "Transfert à l’administration",
    category: "Contact",
    active: false,
    contents: {
      fr: "Votre conversation a été transférée à l’administration. Un membre de notre équipe vous répondra prochainement.",
      en: "Your conversation has been transferred to the administration. A team member will reply shortly.",
      ar: "تم تحويل محادثتك إلى الإدارة. سيتواصل معك أحد أعضاء الفريق قريبًا.",
      tn: "El conversation mte3ek t7awlet lel administration. Wa7ed mel équipe bech يجاوبك قريب.",
    },
  },
  {
    id: 8,
    title: "Document reçu",
    category: "Documents",
    active: false,
    contents: {
      fr: "Bonjour {{nom}}, votre document a bien été reçu et ajouté à votre dossier.",
      en: "Hello {{nom}}, your document has been received and added to your file.",
      ar: "مرحبًا {{nom}}، تم استلام وثيقتك وإضافتها إلى ملفك.",
      tn: "Aslema {{nom}}, el document mte3ek wsel w tzad fi dossier mte3ek.",
    },
  },
];

const emptyForm = {
  title: "",
  category: "Rendez-vous",
  active: true,
  contents: {
    fr: "",
    en: "",
    ar: "",
    tn: "",
  },
};

function createEmptyForm() {
  return {
    title: "",
    category: "Rendez-vous",
    active: true,
    contents: {
      fr: "",
      en: "",
      ar: "",
      tn: "",
    },
  };
}

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function categoryClassName(category) {
  return normalizeText(category)
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function ReponsesIA() {
  const [responses, setResponses] = useState(initialResponses);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editingResponse, setEditingResponse] = useState(null);
  const [responseToDelete, setResponseToDelete] = useState(null);

  const [formData, setFormData] = useState(createEmptyForm());
  const [activeFormLanguage, setActiveFormLanguage] = useState("fr");

  const [previewLanguages, setPreviewLanguages] = useState({});

  const filteredResponses = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm.trim());

    return responses.filter((response) => {
      const matchesCategory =
        selectedCategory === "Toutes" ||
        response.category === selectedCategory;

      if (!normalizedSearch) {
        return matchesCategory;
      }

      const contentsText = Object.values(response.contents)
        .join(" ")
        .toLowerCase();

      const searchableText = normalizeText(
        `${response.title} ${response.category} ${contentsText}`
      );

      return (
        matchesCategory &&
        searchableText.includes(normalizedSearch)
      );
    });
  }, [responses, searchTerm, selectedCategory]);

  const activeResponsesCount = responses.filter(
    (response) => response.active
  ).length;

  const openAddModal = () => {
    setEditingResponse(null);
    setFormData(createEmptyForm());
    setActiveFormLanguage("fr");
    setIsFormModalOpen(true);
  };

  const openEditModal = (response) => {
    setEditingResponse(response);

    setFormData({
      title: response.title,
      category: response.category,
      active: response.active,
      contents: {
        fr: response.contents.fr || "",
        en: response.contents.en || "",
        ar: response.contents.ar || "",
        tn: response.contents.tn || "",
      },
    });

    setActiveFormLanguage("fr");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingResponse(null);
    setActiveFormLanguage("fr");
    setFormData(createEmptyForm());
  };

  const handleGeneralInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleContentChange = (languageId, value) => {
    setFormData((currentData) => ({
      ...currentData,
      contents: {
        ...currentData.contents,
        [languageId]: value,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const hasAtLeastOneMessage = Object.values(
      formData.contents
    ).some((content) => content.trim());

    if (
      !formData.title.trim() ||
      !formData.category ||
      !hasAtLeastOneMessage
    ) {
      return;
    }

    const cleanedContents = {
      fr: formData.contents.fr.trim(),
      en: formData.contents.en.trim(),
      ar: formData.contents.ar.trim(),
      tn: formData.contents.tn.trim(),
    };

    if (editingResponse) {
      setResponses((currentResponses) =>
        currentResponses.map((response) =>
          response.id === editingResponse.id
            ? {
                ...response,
                title: formData.title.trim(),
                category: formData.category,
                active: formData.active,
                contents: cleanedContents,
              }
            : response
        )
      );
    } else {
      const newResponse = {
        id: Date.now(),
        title: formData.title.trim(),
        category: formData.category,
        active: formData.active,
        contents: cleanedContents,
      };

      setResponses((currentResponses) => [
        newResponse,
        ...currentResponses,
      ]);
    }

    closeFormModal();
  };

  const toggleResponseStatus = (responseId) => {
    setResponses((currentResponses) =>
      currentResponses.map((response) =>
        response.id === responseId
          ? {
              ...response,
              active: !response.active,
            }
          : response
      )
    );
  };

  const openDeleteModal = (response) => {
    setResponseToDelete(response);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setResponseToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    if (!responseToDelete) {
      return;
    }

    setResponses((currentResponses) =>
      currentResponses.filter(
        (response) => response.id !== responseToDelete.id
      )
    );

    closeDeleteModal();
  };

  const getPreviewLanguage = (response) => {
    const selectedLanguage =
      previewLanguages[response.id] || "fr";

    if (response.contents[selectedLanguage]) {
      return selectedLanguage;
    }

    const firstAvailableLanguage = languageOptions.find(
      (language) => response.contents[language.id]
    );

    return firstAvailableLanguage?.id || "fr";
  };

  const changePreviewLanguage = (responseId, languageId) => {
    setPreviewLanguages((currentLanguages) => ({
      ...currentLanguages,
      [responseId]: languageId,
    }));
  };

  const activeLanguageData =
    languageOptions.find(
      (language) => language.id === activeFormLanguage
    ) || languageOptions[0];

  return (
    <div className="automatic-messages-page">
      <Sidebar />

      <main className="automatic-messages-main">
        <header className="automatic-messages-header">
          <div>
            <span className="automatic-messages-overline">
              Configuration du chatbot
            </span>

            <h1>Messages automatiques</h1>

            <p>
              Gérez les réponses multilingues utilisées par Tabibi
              pour communiquer avec les patients.
            </p>
          </div>

          <button
            type="button"
            className="automatic-messages-primary-button"
            onClick={openAddModal}
          >
            <Plus size={19} />
            Nouvelle réponse
          </button>
        </header>

        <section className="automatic-messages-stats">
          <article className="automatic-messages-stat-card">
            <div className="automatic-messages-stat-icon total">
              <Bot size={22} />
            </div>

            <div>
              <span>Total des réponses</span>
              <strong>{responses.length}</strong>
            </div>
          </article>

          <article className="automatic-messages-stat-card">
            <div className="automatic-messages-stat-icon active">
              <Check size={22} />
            </div>

            <div>
              <span>Réponses actives</span>
              <strong>{activeResponsesCount}</strong>
            </div>
          </article>

          <article className="automatic-messages-stat-card">
            <div className="automatic-messages-stat-icon inactive">
              <Power size={22} />
            </div>

            <div>
              <span>Réponses désactivées</span>
              <strong>
                {responses.length - activeResponsesCount}
              </strong>
            </div>
          </article>

          <article className="automatic-messages-stat-card">
            <div className="automatic-messages-stat-icon languages">
              <Languages size={22} />
            </div>

            <div>
              <span>Langues disponibles</span>
              <strong>4</strong>
            </div>
          </article>
        </section>

        <section className="automatic-messages-toolbar">
          <div className="automatic-messages-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Rechercher dans toutes les langues..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            {searchTerm && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setSearchTerm("")}
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="automatic-messages-categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category ? "active" : ""
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section className="automatic-messages-content">
          <div className="automatic-messages-section-heading">
            <div>
              <h2>Bibliothèque des réponses</h2>

              <p>
                {filteredResponses.length} réponse
                {filteredResponses.length !== 1 ? "s" : ""}{" "}
                affichée
                {filteredResponses.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {filteredResponses.length > 0 ? (
            <div className="automatic-messages-grid">
              {filteredResponses.map((response) => {
                const CategoryIcon =
                  categoryIcons[response.category] ||
                  MessageCircle;

                const previewLanguageId =
                  getPreviewLanguage(response);

                const previewLanguage =
                  languageOptions.find(
                    (language) =>
                      language.id === previewLanguageId
                  ) || languageOptions[0];

                const availableLanguages =
                  languageOptions.filter(
                    (language) =>
                      response.contents[language.id]
                  );

                return (
                  <article
                    key={response.id}
                    className={`automatic-message-card ${
                      response.active ? "" : "disabled"
                    }`}
                  >
                    <div className="automatic-message-card-top">
                      <div
                        className={`automatic-message-category-icon ${categoryClassName(
                          response.category
                        )}`}
                      >
                        <CategoryIcon size={20} />
                      </div>

                      <div className="automatic-message-card-title">
                        <h3>{response.title}</h3>

                        <span className="automatic-message-category-badge">
                          {response.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        className={`automatic-message-status ${
                          response.active
                            ? "active"
                            : "inactive"
                        }`}
                        onClick={() =>
                          toggleResponseStatus(response.id)
                        }
                      >
                        <span />

                        {response.active
                          ? "Active"
                          : "Désactivée"}
                      </button>
                    </div>

                    <div className="automatic-message-languages">
                      <span className="automatic-message-languages-title">
                        Aperçu :
                      </span>

                      <div className="automatic-message-language-buttons">
                        {availableLanguages.map((language) => (
                          <button
                            key={language.id}
                            type="button"
                            className={
                              previewLanguageId === language.id
                                ? "active"
                                : ""
                            }
                            onClick={() =>
                              changePreviewLanguage(
                                response.id,
                                language.id
                              )
                            }
                          >
                            {language.shortLabel}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className="automatic-message-preview"
                      dir={previewLanguage.direction}
                    >
                      <div className="automatic-message-preview-header">
                        <Languages size={15} />

                        <span>{previewLanguage.label}</span>
                      </div>

                      <p>
                        {response.contents[
                          previewLanguageId
                        ] || "Aucun message disponible."}
                      </p>
                    </div>

                    <div className="automatic-message-card-footer">
                      <div className="automatic-message-available-count">
                        <Languages size={15} />

                        <span>
                          {availableLanguages.length}/4 langues
                        </span>
                      </div>

                      <div className="automatic-message-actions">
                        <button
                          type="button"
                          className="automatic-message-action edit"
                          onClick={() =>
                            openEditModal(response)
                          }
                        >
                          <Edit3 size={17} />
                          Modifier
                        </button>

                        <button
                          type="button"
                          className="automatic-message-action delete"
                          onClick={() =>
                            openDeleteModal(response)
                          }
                        >
                          <Trash2 size={17} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="automatic-messages-empty">
              <div className="automatic-messages-empty-icon">
                <MessageCircle size={28} />
              </div>

              <h3>Aucune réponse trouvée</h3>

              <p>
                Modifiez votre recherche ou ajoutez une
                nouvelle réponse multilingue.
              </p>

              <button
                type="button"
                className="automatic-messages-primary-button"
                onClick={openAddModal}
              >
                <Plus size={18} />
                Ajouter une réponse
              </button>
            </div>
          )}
        </section>
      </main>

      {isFormModalOpen && (
        <div
          className="automatic-messages-modal-overlay"
          onMouseDown={closeFormModal}
        >
          <div
            className="automatic-messages-modal multilingual-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="automatic-messages-modal-header">
              <div>
                <span>Messages automatiques</span>

                <h2>
                  {editingResponse
                    ? "Modifier la réponse"
                    : "Nouvelle réponse"}
                </h2>
              </div>

              <button
                type="button"
                className="automatic-messages-close-button"
                onClick={closeFormModal}
                aria-label="Fermer"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="automatic-messages-form"
              onSubmit={handleSubmit}
            >
              <div className="automatic-messages-form-row">
                <div className="automatic-messages-form-group title-group">
                  <label htmlFor="title">
                    Titre de la réponse <span>*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Ex. Confirmation de rendez-vous"
                    value={formData.title}
                    onChange={handleGeneralInputChange}
                    required
                  />
                </div>

                <div className="automatic-messages-form-group">
                  <label htmlFor="category">
                    Catégorie <span>*</span>
                  </label>

                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleGeneralInputChange}
                    required
                  >
                    {categories
                      .filter(
                        (category) =>
                          category !== "Toutes"
                      )
                      .map((category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="automatic-messages-translations">
                <div className="automatic-messages-translations-heading">
                  <div>
                    <h3>Traductions du message</h3>

                    <p>
                      Ajoutez une version pour chaque langue
                      utilisée par le chatbot.
                    </p>
                  </div>

                  <div className="automatic-messages-language-progress">
                    {
                      Object.values(formData.contents).filter(
                        (content) => content.trim()
                      ).length
                    }
                    /4 complétées
                  </div>
                </div>

                <div className="automatic-messages-language-tabs">
                  {languageOptions.map((language) => {
                    const hasContent =
                      formData.contents[
                        language.id
                      ]?.trim();

                    return (
                      <button
                        key={language.id}
                        type="button"
                        className={`automatic-messages-language-tab ${
                          activeFormLanguage === language.id
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setActiveFormLanguage(language.id)
                        }
                      >
                        <span>
                          {language.shortLabel}
                        </span>

                        {language.label}

                        {hasContent && (
                          <Check
                            className="language-completed-icon"
                            size={14}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="automatic-messages-language-editor"
                  dir={activeLanguageData.direction}
                >
                  <div className="automatic-messages-label-row">
                    <label
                      htmlFor={`content-${activeFormLanguage}`}
                    >
                      Message en {activeLanguageData.label}
                    </label>

                    <small>
                      Variables : {"{{nom}}"},{" "}
                      {"{{date}}"}, {"{{heure}}"},{" "}
                      {"{{adresse}}"}
                    </small>
                  </div>

                  <textarea
                    id={`content-${activeFormLanguage}`}
                    rows="7"
                    dir={activeLanguageData.direction}
                    placeholder={`Saisissez le message en ${activeLanguageData.label}...`}
                    value={
                      formData.contents[
                        activeFormLanguage
                      ]
                    }
                    onChange={(event) =>
                      handleContentChange(
                        activeFormLanguage,
                        event.target.value
                      )
                    }
                  />

                  <div className="automatic-messages-character-count">
                    {
                      formData.contents[
                        activeFormLanguage
                      ].length
                    }{" "}
                    caractères
                  </div>
                </div>

                <p className="automatic-messages-language-help">
                  Il faut remplir au moins une langue pour
                  enregistrer la réponse.
                </p>
              </div>

              <label className="automatic-messages-switch-row">
                <div>
                  <strong>Activer cette réponse</strong>

                  <span>
                    Le chatbot pourra utiliser les traductions
                    disponibles de ce message.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(event) =>
                    setFormData((currentData) => ({
                      ...currentData,
                      active: event.target.checked,
                    }))
                  }
                />

                <span className="automatic-messages-switch" />
              </label>

              <div className="automatic-messages-modal-footer">
                <button
                  type="button"
                  className="automatic-messages-secondary-button"
                  onClick={closeFormModal}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="automatic-messages-primary-button"
                >
                  <Check size={18} />

                  {editingResponse
                    ? "Enregistrer"
                    : "Ajouter la réponse"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && responseToDelete && (
        <div
          className="automatic-messages-modal-overlay"
          onMouseDown={closeDeleteModal}
        >
          <div
            className="automatic-messages-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="automatic-messages-delete-icon">
              <Trash2 size={25} />
            </div>

            <h2>Supprimer cette réponse ?</h2>

            <p>
              La réponse{" "}
              <strong>
                « {responseToDelete.title} »
              </strong>{" "}
              et toutes ses traductions seront supprimées.
            </p>

            <div className="automatic-messages-delete-actions">
              <button
                type="button"
                className="automatic-messages-secondary-button"
                onClick={closeDeleteModal}
              >
                Annuler
              </button>

              <button
                type="button"
                className="automatic-messages-danger-button"
                onClick={confirmDelete}
              >
                <Trash2 size={17} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReponsesIA;