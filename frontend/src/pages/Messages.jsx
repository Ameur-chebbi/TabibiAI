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

function buildMessageFromEntry(entry) {
  return {
    id: entry.id,
    type: entry.sender === "patient" ? "received" : "sent",
    text: entry.message || "",
    time: formatMessageTime(entry.created_at),
    createdAt: entry.created_at || null,
  };
}

function sortMessagesByCreatedAt(messagesToSort) {
  return [...messagesToSort].sort((left, right) => {
    const leftTimestamp = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTimestamp = right.createdAt ? Date.parse(right.createdAt) : 0;
    return leftTimestamp - rightTimestamp;
  });
}

function buildFallbackAISuggestion(conversationMessages) {
  const latestPatientMessage = [...conversationMessages]
    .filter((message) => message.type === "received")
    .slice(-1)[0];

  if (latestPatientMessage) {
    return `Bonjour, je vous réponds concernant votre message : "${latestPatientMessage.text}". Je vous propose de confirmer votre rendez-vous ou de me préciser si vous avez besoin d’un complément d’information.`;
  }

  return "Bonjour, merci pour votre message. Je vous réponds dès que possible et je reste à votre disposition.";
}

function normalizeConversationRows(rows) {
  const grouped = rows.reduce((acc, entry) => {
    const patientId = entry.patient_id;

    if (!acc[patientId]) {
      acc[patientId] = {
        id: patientId,
        patientId,
        name: entry.patients?.name || "Patient",
        phone: entry.patients?.phone || "",
        initials: (entry.patients?.name || "Patient")
          .split(" ")
          .map((word) => word.charAt(0))
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        preview: entry.message || "",
        time: formatConversationTime(entry.created_at),
        unread: 0,
        online: false,
        messages: [],
        suggestion: "Bonjour, je peux vous aider avec votre rendez-vous.",
        latestMessageTimestamp: entry.created_at || "",
      };
    }

    acc[patientId].messages.push(buildMessageFromEntry(entry));

    acc[patientId].preview = entry.message || "";
    acc[patientId].time = formatConversationTime(entry.created_at);

    if (!acc[patientId].latestMessageTimestamp || entry.created_at > acc[patientId].latestMessageTimestamp) {
      acc[patientId].latestMessageTimestamp = entry.created_at || "";
    }

    return acc;
  }, {});

  return Object.values(grouped).sort((left, right) => {
    const leftTimestamp = Date.parse(left.latestMessageTimestamp || 0);
    const rightTimestamp = Date.parse(right.latestMessageTimestamp || 0);
    return rightTimestamp - leftTimestamp;
  });
}

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

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  );

  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          patient_id,
          sender,
          message,
          created_at,
          patients!patient_id (
            name,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Conversations error:", error);
        setErrorMessage("Impossible de charger les conversations.");
        setLoading(false);
        return;
      }

      const normalizedConversations = normalizeConversationRows(data || []);
      const initialConversation = normalizedConversations[0];

      setConversations(normalizedConversations);
      setSelectedConversationId(initialConversation?.id || null);
      setMessages(sortMessagesByCreatedAt(initialConversation?.messages || []));
      setLoading(false);
    }

    loadConversations();
  }, []);

  useEffect(() => {
    const selectedPatient = conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );

    if (!selectedConversationId || !selectedPatient?.patientId) {
      return undefined;
    }

    const channel = supabase
      .channel(`conversation-${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `patient_id=eq.${selectedPatient.patientId}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);

          const updatedRow = payload.new ?? payload.old;

          if (!updatedRow || payload.eventType === "DELETE") {
            return;
          }

          const nextMessage = buildMessageFromEntry(updatedRow);

          setMessages((currentMessages) => {
            const alreadyExists = currentMessages.some((message) => message.id === nextMessage.id);

            if (alreadyExists) {
              return currentMessages;
            }

            return sortMessagesByCreatedAt([...currentMessages, nextMessage]);
          });

          setConversations((current) => {
            const targetConversation = current.find(
              (conversation) => conversation.patientId === selectedPatient.patientId
            );

            if (!targetConversation) {
              return current;
            }

            const messageAlreadyExists = targetConversation.messages.some(
              (message) => message.id === nextMessage.id
            );

            if (messageAlreadyExists) {
              return current;
            }

            const nextConversationMessages = sortMessagesByCreatedAt([
              ...targetConversation.messages,
              nextMessage,
            ]);

            return current.map((conversation) =>
              conversation.patientId === selectedPatient.patientId
                ? {
                    ...conversation,
                    preview: updatedRow.message || "",
                    time: formatConversationTime(updatedRow.created_at),
                    latestMessageTimestamp: updatedRow.created_at || conversation.latestMessageTimestamp,
                    messages: nextConversationMessages,
                  }
                : conversation
            );
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, selectedConversation?.patientId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [conversations, searchValue]);

  async function refreshConversation(patientId) {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        id,
        patient_id,
        sender,
        message,
        created_at,
        patients!patient_id (
          name,
          phone
        )
      `)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Patient conversation history error:", error);
      throw error;
    }

    const normalizedConversation = normalizeConversationRows(data || []);
    const nextConversation = normalizedConversation[0];

    if (!nextConversation) {
      return null;
    }

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.patientId !== patientId) {
          return conversation;
        }

        return {
          ...conversation,
          ...nextConversation,
          id: conversation.id,
          patientId: conversation.patientId,
          messages: nextConversation.messages,
        };
      })
    );

    setMessages(sortMessagesByCreatedAt(nextConversation.messages || []));

    return nextConversation;
  }

  useEffect(() => {
    if (!chatBodyRef.current) return;

    requestAnimationFrame(() => {
      chatBodyRef.current?.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages.length, selectedConversationId]);

  async function generateAISuggestion(conversation) {
    if (!conversation || !conversation.patientId) {
      return;
    }

    setIsGeneratingSuggestion(true);

    const conversationMessages = messages.filter((message) => {
      if (!message?.id) {
        return false;
      }

      return true;
    });

    const latestPatientMessages = conversationMessages
      .filter((message) => message.type === "received")
      .slice(-3);

    const prompt = `You are an intelligent medical secretary helping a doctor manage patient communication.

Analyze the patient's latest messages and conversation history.
Generate a short, polite, professional reply that the secretary can send to the patient.
Your role is to help manage the medical cabinet communication.

Rules:
- Help patients book appointments.
- Help patients modify or cancel appointments.
- Ask for missing information needed to manage appointments.
- Provide cabinet information when available (address, phone number, working hours, specialties, consultation price).
- Respect the patient's preferred language and reply in the selected language (French, English, or Arabic).
- Keep replies natural and suitable for WhatsApp communication.

Important rules:
- Do not provide medical diagnosis.
- Do not give medical advice.
- Do not prescribe medication.
- Do not invent cabinet information.
- Do not invent appointment availability.
- If information is missing, politely ask the patient for details or indicate that the secretary will confirm.

Examples:
Patient: "I want an appointment"
Suggested reply: "Bonjour, merci pour votre message. Nous pouvons organiser votre rendez-vous. Pouvez-vous nous préciser la date et l'heure qui vous conviennent ?"

Patient: "I want to change my appointment"
Suggested reply: "Bonjour, nous pouvons modifier votre rendez-vous. Pouvez-vous nous indiquer la nouvelle date ou l'horaire souhaité afin de vérifier les disponibilités ?"

Patient: "Where is the cabinet?"
Suggested reply: "Bonjour, notre cabinet est situé à [adresse du cabinet]. Nous restons à votre disposition pour toute information complémentaire."

Patient: "How much is the consultation?"
Suggested reply: "Bonjour, le tarif de la consultation est de [prix]. N'hésitez pas à nous contacter pour organiser votre rendez-vous."

Conversation history:
${conversationMessages
  .map((message) => `${message.type === "received" ? "Patient" : "Secretary"}: ${message.text}`)
  .join("\n") || "Aucun message récent"}

Return only the suggested message text, without explanations.`;

    try {
      const response = await fetch("/api/ai-suggestion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          conversationHistory: conversationMessages.map((message) => ({
            sender: message.type === "received" ? "patient" : "doctor",
            message: message.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const result = await response.json();
      const suggestedText = result.suggestion?.trim();

      if (suggestedText) {
        setAiSuggestion(suggestedText);
        setIsGeneratingSuggestion(false);
        return;
      }

      setAiSuggestion(buildFallbackAISuggestion(conversationMessages));
    } catch (error) {
      console.error("AI suggestion error:", error);
      setAiSuggestion(buildFallbackAISuggestion(conversationMessages));
    } finally {
      setIsGeneratingSuggestion(false);
    }
  }

  useEffect(() => {
    if (!selectedConversation) {
      setAiSuggestion("");
      return;
    }

    setAiSuggestion(selectedConversation.suggestion || "Bonjour, je peux vous aider avec votre rendez-vous.");
    generateAISuggestion(selectedConversation);
  }, [selectedConversation?.id, selectedConversation?.patientId, messages.length]);

  async function handleSelectConversation(id) {
    setSelectedConversationId(id);
    setMessageValue("");
    setErrorMessage("");

    try {
      await refreshConversation(id);
    } catch {
      setErrorMessage("Impossible de charger l'historique de cette conversation.");
    }
  }

  function handleViewPatient() {
    if (!selectedConversation) return;

    navigate(`/patients?patient=${selectedConversation.patientId}`);
  }

  function handleUseSuggestion() {
    if (!selectedConversation) return;

    setMessageValue(aiSuggestion || selectedConversation.suggestion || "");
  }

  async function handleSendMessage() {
    const cleanMessage = messageValue.trim();

    if (!cleanMessage || !selectedConversation || isSending) {
      return;
    }

    console.log("Before insert", {
      message: cleanMessage,
      selectedConversationId,
      currentMessages: messages,
    });

    setIsSending(true);
    setErrorMessage("");

    const newMessage = {
      patient_id: selectedConversation.patientId,
      sender: "doctor",
      message: cleanMessage,
      created_at: new Date().toISOString(),
    };

    const { data: insertedMessage, error } = await supabase
      .from("conversations")
      .insert([newMessage])
      .select()
      .single();

    console.log("Supabase insert result", { data: insertedMessage, error });

    if (error) {
      console.error("Send message error:", error);
      setErrorMessage("Le message n'a pas pu être envoyé.");
      setIsSending(false);
      return;
    }

    const nextMessage = buildMessageFromEntry(insertedMessage);

    setMessages((currentMessages) => {
      const alreadyExists = currentMessages.some((message) => message.id === nextMessage.id);

      if (alreadyExists) {
        console.log("Updated messages state", currentMessages);
        return currentMessages;
      }

      const updatedMessages = sortMessagesByCreatedAt([...currentMessages, nextMessage]);
      console.log("Updated messages state", updatedMessages);
      return updatedMessages;
    });

    setConversations((current) =>
      current.map((conversation) => {
        if (conversation.patientId !== selectedConversation.patientId) {
          return conversation;
        }

        const nextConversationMessages = sortMessagesByCreatedAt([
          ...conversation.messages,
          nextMessage,
        ]);

        return {
          ...conversation,
          preview: insertedMessage.message || "",
          time: formatConversationTime(insertedMessage.created_at),
          latestMessageTimestamp: insertedMessage.created_at || conversation.latestMessageTimestamp,
          messages: nextConversationMessages,
        };
      })
    );

    setMessageValue("");
    setIsSending(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSendMessage();
  }

  return (
    <div className="messages-page-layout">
      <Sidebar />

      <main className="messages-main-content">
        <section className="conversations-section">
          <div className="conversations-header">
            <div>
              <h1>Messages</h1>
              <p>Gérez les conversations avec vos patients.</p>
            </div>
          </div>

          <div className="conversations-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>

          <div className="conversations-list">
            {loading ? (
              <div className="empty-chat-section">Chargement des conversations...</div>
            ) : errorMessage ? (
              <div className="empty-chat-section">{errorMessage}</div>
            ) : (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={
                    selectedConversationId === conversation.id
                      ? "conversation-item active"
                      : "conversation-item"
                  }
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <div className="conversation-avatar">
                    {conversation.initials}

                    {conversation.online && <span className="conversation-online-dot" />}
                  </div>

                  <div className="conversation-details">
                    <div className="conversation-top-line">
                      <strong>{conversation.name}</strong>
                      <span>{conversation.time}</span>
                    </div>

                    <div className="conversation-bottom-line">
                      <p>{conversation.preview}</p>

                      {conversation.unread > 0 && (
                        <span className="conversation-unread">{conversation.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {selectedConversation ? (
          <section className="chat-section">
            <header className="chat-header">
              <div className="chat-patient">
                <div className="chat-patient-avatar">{selectedConversation.initials}</div>

                <div>
                  <h2>{selectedConversation.name}</h2>
                  <span className={selectedConversation.online ? "patient-status online" : "patient-status"}>
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
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={message.type === "sent" ? "message-row sent" : "message-row received"}
                >
                  <div className="message-bubble">
                    <p>{message.text}</p>

                    <div className="message-time">
                      <span>{message.time}</span>
                      {message.type === "sent" && <CheckCheck size={15} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="ai-suggestion">
              <div className="ai-suggestion-icon">
                <Bot size={20} />
              </div>

              <div className="ai-suggestion-content">
                <strong>Suggestion IA</strong>
                <p>{isGeneratingSuggestion ? "Génération de la suggestion..." : aiSuggestion || selectedConversation.suggestion}</p>
              </div>

              <button type="button" className="use-suggestion-button" onClick={handleUseSuggestion}>
                Utiliser
              </button>
            </div>

            <form className="message-composer" onSubmit={handleSubmit}>
              <button type="button" className="composer-icon-button">
                <Paperclip size={21} />
              </button>

              <input
                type="text"
                placeholder="Écrire un message..."
                value={messageValue}
                onChange={(event) => setMessageValue(event.target.value)}
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
          <section className="empty-chat-section">Sélectionnez une conversation.</section>
        )}
      </main>
    </div>
  );
}

export default Messages;
