import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  CheckCheck,
  Paperclip,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import { supabase } from "../supabase";
import "./Messages.css";

// ─── pure helpers ────────────────────────────────────────────────────────────

function formatConversationTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  return (name || "Patient")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

function buildMessageFromRow(row) {
  return {
    id: row.id,
    type: row.sender === "patient" ? "received" : "sent",
    text: row.message || "",
    time: formatMessageTime(row.created_at),
    createdAt: row.created_at || null,
  };
}

function sortByCreatedAt(list) {
  return [...list].sort((a, b) => {
    return (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0);
  });
}

/**
 * Groups a flat array of conversation rows (one row per message) into one
 * conversation object per patient.  Returns the list sorted newest-first.
 */
function groupRowsIntoConversations(rows) {
  const map = {};

  for (const row of rows) {
    const pid = row.patient_id;
    if (!pid) continue;

    if (!map[pid]) {
      const name = row.patients?.name || "Patient";
      map[pid] = {
        // Use patient_id as the stable conversation id throughout the app
        id: pid,
        patientId: pid,
        name,
        phone: row.patients?.phone || "",
        initials: getInitials(name),
        preview: "",
        time: "",
        latestTimestamp: "",
        unread: 0,
        online: false,
        messages: [],
      };
    }

    map[pid].messages.push(buildMessageFromRow(row));

    // Keep preview + time pointing at the most recent message in this group
    if (!map[pid].latestTimestamp || row.created_at > map[pid].latestTimestamp) {
      map[pid].preview = row.message || "";
      map[pid].time = formatConversationTime(row.created_at);
      map[pid].latestTimestamp = row.created_at || "";
    }
  }

  // Sort conversations newest-first
  return Object.values(map).sort(
    (a, b) => Date.parse(b.latestTimestamp) - Date.parse(a.latestTimestamp)
  );
}

function buildFallbackSuggestion(msgs) {
  const last = [...msgs].filter((m) => m.type === "received").slice(-1)[0];
  if (last) {
    return `Bonjour, je vous réponds concernant votre message : "${last.text}". Pouvez-vous me préciser si vous avez besoin d'un rendez-vous ou d'un complément d'information ?`;
  }
  return "Bonjour, merci pour votre message. Je reste à votre disposition.";
}

// ─── Supabase data layer ──────────────────────────────────────────────────────

/**
 * Fetches every conversation row then enriches each one with patient info
 * via a separate batch query on the patients table.
 *
 * We deliberately avoid Supabase's PostgREST join syntax (`patients(...)`)
 * because it requires a registered FK constraint in the Supabase schema cache.
 * When that constraint is missing the embed silently returns null for every
 * row even though the data exists — which is exactly the "0 raw rows" symptom.
 */
async function fetchAllConversationRows() {
  // Step 1 — fetch all conversation rows, no join
  const { data: rows, error: rowsError } = await supabase
    .from("conversations")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("RAW CONVERSATIONS:", rows);
  console.log("SUPABASE ERROR:", rowsError);

  if (rowsError) return { data: null, error: rowsError };
  if (!rows || rows.length === 0) return { data: [], error: null };

  // Step 2 — collect unique patient_ids and fetch those patients in one query
  const patientIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];

  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("id, name, phone, email")
    .in("id", patientIds);

  if (patientsError) {
    // Non-fatal: return rows without patient info so the list still renders
    console.warn("Could not fetch patients:", patientsError.message);
    return { data: rows.map((r) => ({ ...r, patients: null })), error: null };
  }

  // Step 3 — merge patient data onto each row
  const patientMap = Object.fromEntries((patients || []).map((p) => [p.id, p]));
  const enriched = rows.map((r) => ({
    ...r,
    patients: patientMap[r.patient_id] || null,
  }));

  return { data: enriched, error: null };
}

/**
 * Fetches all messages for a single patient, enriched with patient info.
 */
async function fetchPatientRows(patientId) {
  const { data: rows, error: rowsError } = await supabase
    .from("conversations")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: true });

  if (rowsError) return { data: null, error: rowsError };
  if (!rows || rows.length === 0) return { data: [], error: null };

  const { data: patientData } = await supabase
    .from("patients")
    .select("id, name, phone, email")
    .eq("id", patientId)
    .single();

  return {
    data: rows.map((r) => ({ ...r, patients: patientData || null })),
    error: null,
  };
}

// ─── component ────────────────────────────────────────────────────────────────

function Messages() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const chatBodyRef = useRef(null);

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId) || null;

  // ── initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await fetchAllConversationRows();

      if (cancelled) return;

      if (error) {
        console.error("Messages load error:", error);
        setErrorMessage("Impossible de charger les conversations.");
        setLoading(false);
        return;
      }

      console.info(`Messages: ${(data || []).length} rows loaded from conversations`);

      const grouped = groupRowsIntoConversations(data || []);
      const first = grouped[0] || null;

      setConversations(grouped);

      if (first) {
        setSelectedConversationId(first.id);
        setMessages(sortByCreatedAt(first.messages));
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── realtime subscription for the selected patient ─────────────────────────
  useEffect(() => {
    if (!selectedConversationId) return;

    const patientId = selectedConversationId; // id === patientId in our model

    const channel = supabase
      .channel(`messages-patient-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const row = payload.new;
          if (!row) return;

          const newMsg = buildMessageFromRow(row);

          // Update the open chat thread
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return sortByCreatedAt([...prev, newMsg]);
          });

          // Update the preview in the sidebar list
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.patientId !== patientId) return conv;
              if (conv.messages.some((m) => m.id === newMsg.id)) return conv;
              return {
                ...conv,
                preview: row.message || conv.preview,
                time: formatConversationTime(row.created_at),
                latestTimestamp: row.created_at || conv.latestTimestamp,
                messages: sortByCreatedAt([...conv.messages, newMsg]),
              };
            })
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info(`Realtime subscribed for patient ${patientId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  // ── auto-scroll when new messages arrive ──────────────────────────────────
  useEffect(() => {
    if (!chatBodyRef.current) return;
    requestAnimationFrame(() => {
      chatBodyRef.current?.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages.length, selectedConversationId]);

  // ── search filter ──────────────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    const q = searchValue.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q)
    );
  }, [conversations, searchValue]);

  // ── AI suggestion ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedConversation) {
      setAiSuggestion("");
      return;
    }
    generateAISuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, messages.length]);

  async function generateAISuggestion() {
    setIsGeneratingSuggestion(true);

    const history = messages.map((m) => ({
      sender: m.type === "received" ? "patient" : "doctor",
      message: m.text,
    }));

    const latestPatientMsg = messages
      .filter((m) => m.type === "received")
      .slice(-1)[0]?.text || "";

    try {
      const response = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: latestPatientMsg,
          conversationHistory: history,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      const suggestion = result.suggestion?.trim();

      setAiSuggestion(suggestion || buildFallbackSuggestion(messages));
    } catch (err) {
      console.error("AI suggestion error:", err);
      setAiSuggestion(buildFallbackSuggestion(messages));
    } finally {
      setIsGeneratingSuggestion(false);
    }
  }

  // ── select a conversation ──────────────────────────────────────────────────
  async function handleSelectConversation(patientId) {
    if (patientId === selectedConversationId) return;

    setSelectedConversationId(patientId);
    setMessageValue("");
    setErrorMessage("");
    setMessages([]);
    setAiSuggestion("");

    // Fetch full thread for this patient
    const { data, error } = await fetchPatientRows(patientId);

    if (error) {
      console.error("Thread load error:", error);
      setErrorMessage("Impossible de charger l'historique de cette conversation.");
      return;
    }

    const grouped = groupRowsIntoConversations(data || []);
    const conv = grouped[0] || null;

    if (!conv) return;

    // Patch the conversation entry in the sidebar with up-to-date info
    setConversations((prev) =>
      prev.map((c) =>
        c.id === patientId
          ? { ...c, ...conv, id: patientId, patientId }
          : c
      )
    );

    setMessages(sortByCreatedAt(conv.messages));
  }

  // ── send a message ─────────────────────────────────────────────────────────
  async function handleSendMessage() {
    const text = messageValue.trim();
    if (!text || !selectedConversation || isSending) return;

    setIsSending(true);
    setErrorMessage("");

    const { data: inserted, error } = await supabase
      .from("conversations")
      .insert([{
        patient_id: selectedConversation.patientId,
        sender: "doctor",
        message: text,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      console.error("Send message error:", error);
      setErrorMessage("Le message n'a pas pu être envoyé.");
      setIsSending(false);
      return;
    }

    const newMsg = buildMessageFromRow(inserted);

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return sortByCreatedAt([...prev, newMsg]);
    });

    setConversations((prev) =>
      prev.map((c) => {
        if (c.patientId !== selectedConversation.patientId) return c;
        if (c.messages.some((m) => m.id === newMsg.id)) return c;
        return {
          ...c,
          preview: inserted.message || "",
          time: formatConversationTime(inserted.created_at),
          latestTimestamp: inserted.created_at || c.latestTimestamp,
          messages: sortByCreatedAt([...c.messages, newMsg]),
        };
      })
    );

    setMessageValue("");
    setIsSending(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSendMessage();
  }

  function handleUseSuggestion() {
    if (aiSuggestion) setMessageValue(aiSuggestion);
  }

  function handleViewPatient() {
    if (!selectedConversation) return;
    navigate(`/patients?patient=${selectedConversation.patientId}`);
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="messages-page-layout">
      <Sidebar />

      <main className="messages-main-content">
        {/* ── Conversations sidebar ── */}
        <section className="conversations-section">
          <div className="conversations-header">
            <h1>Messages</h1>
            <p>Gérez les conversations avec vos patients.</p>
          </div>

          <div className="conversations-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          <div className="conversations-list">
            {loading ? (
              /* Skeleton rows */
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="conversation-item conversation-item--skeleton">
                  <div className="conv-skeleton-avatar" />
                  <div className="conv-skeleton-lines">
                    <div className="conv-skeleton-name" />
                    <div className="conv-skeleton-preview" />
                  </div>
                </div>
              ))
            ) : errorMessage ? (
              <div className="conversations-error">
                <p>{errorMessage}</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="no-conversations">
                {searchValue
                  ? "Aucun résultat pour cette recherche."
                  : "Aucune conversation disponible."}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className={`conversation-item${conv.id === selectedConversationId ? " active" : ""}`}
                  onClick={() => handleSelectConversation(conv.id)}
                >
                  <div className="conversation-avatar">
                    {conv.initials}
                    {conv.online && <span className="conversation-online-dot" />}
                  </div>

                  <div className="conversation-details">
                    <div className="conversation-top-line">
                      <strong>{conv.name}</strong>
                      <span>{conv.time}</span>
                    </div>

                    <div className="conversation-bottom-line">
                      <p>{conv.preview}</p>
                      {conv.unread > 0 && (
                        <span className="conversation-unread">{conv.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* ── Chat panel ── */}
        {selectedConversation ? (
          <section className="chat-section">
            <header className="chat-header">
              <div className="chat-patient">
                <div className="chat-patient-avatar">{selectedConversation.initials}</div>
                <div>
                  <h2>{selectedConversation.name}</h2>
                  <span className={`patient-status${selectedConversation.online ? " online" : ""}`}>
                    {selectedConversation.online ? "En ligne" : "Hors ligne"}
                  </span>
                </div>
              </div>

              <div className="chat-actions">
                <button className="view-patient-button" type="button" onClick={handleViewPatient}>
                  <UserRound size={18} />
                  Voir le patient
                </button>
              </div>
            </header>

            <div className="chat-body" ref={chatBodyRef}>
              {messages.length === 0 ? (
                <p className="chat-empty-state">Aucun message dans cette conversation.</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-row ${msg.type === "sent" ? "sent" : "received"}`}
                  >
                    <div className="message-bubble">
                      <p>{msg.text}</p>
                      <div className="message-time">
                        <span>{msg.time}</span>
                        {msg.type === "sent" && <CheckCheck size={15} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ai-suggestion">
              <div className="ai-suggestion-icon">
                <Bot size={20} />
              </div>

              <div className="ai-suggestion-content">
                <strong>Suggestion IA</strong>
                <p>
                  {isGeneratingSuggestion
                    ? "Génération de la suggestion..."
                    : aiSuggestion || "—"}
                </p>
              </div>

              <button
                type="button"
                className="use-suggestion-button"
                onClick={handleUseSuggestion}
                disabled={!aiSuggestion || isGeneratingSuggestion}
              >
                Utiliser
              </button>
            </div>

            <form className="message-composer" onSubmit={handleSubmit}>
              <button type="button" className="composer-icon-button" aria-label="Joindre un fichier">
                <Paperclip size={21} />
              </button>

              <input
                type="text"
                placeholder="Écrire un message..."
                value={messageValue}
                onChange={(e) => setMessageValue(e.target.value)}
              />

              <button
                type="submit"
                className="send-message-button"
                disabled={!messageValue.trim() || isSending}
              >
                <Send size={19} />
                {isSending ? "Envoi..." : "Envoyer"}
              </button>
            </form>
          </section>
        ) : (
          <section className="empty-chat-section">
            {loading ? "Chargement..." : "Sélectionnez une conversation."}
          </section>
        )}
      </main>
    </div>
  );
}

export default Messages;
