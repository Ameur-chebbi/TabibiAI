import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Converts an ISO timestamp to a short relative French label.
 * e.g. "Il y a 2 min", "Il y a 3 h", "Il y a 2 j"
 */
function relativeTime(isoString) {
  if (!isoString) return "";

  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

/**
 * Derives up to two uppercase initials from a patient name.
 * "Ahmed Ben Ali" → "AB"
 */
function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

/**
 * Props
 * ─────
 * messages : Array<{
 *   id        : string | number
 *   name      : string   — patient name
 *   message   : string   — last message text
 *   createdAt : string   — ISO timestamp
 * }>
 * loading : boolean
 */
function RecentMessages({ messages = [], loading = false }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Messages récents</h2>
          <p>Dernières conversations reçues</p>
        </div>

        <Link to="/messages" className="panel-link">
          Voir tout
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="messages-list">
        {loading ? (
          /* Skeleton rows while fetching */
          [1, 2, 3].map((n) => (
            <div key={n} className="message-item message-item--skeleton">
              <div className="skeleton-block skeleton-avatar" />
              <div className="skeleton-block skeleton-text" />
            </div>
          ))
        ) : messages.length === 0 ? (
          <p className="panel-empty-state">Aucun message récent.</p>
        ) : (
          messages.map((msg) => (
            <article className="message-item" key={msg.id}>
              <div className="message-avatar" aria-hidden="true">
                {getInitials(msg.name)}
              </div>

              <div className="message-content">
                <div className="message-top">
                  <strong>{msg.name}</strong>
                  <span>{relativeTime(msg.createdAt)}</span>
                </div>

                <p>{msg.message}</p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default RecentMessages;
