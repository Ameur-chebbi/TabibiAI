function RecentMessages() {
  const messages = [
    {
      id: 1,
      name: "Ahmed Ben Ali",
      message: "Bonjour docteur, je veux prendre un rendez-vous.",
      time: "Il y a 2 min",
    },
    {
      id: 2,
      name: "Meriem Trabelsi",
      message: "Quels sont vos horaires aujourd’hui ?",
      time: "Il y a 8 min",
    },
    {
      id: 3,
      name: "Mohamed Gharbi",
      message: "Merci pour votre réponse.",
      time: "Il y a 15 min",
    },
  ];

  return (
    <section className="dashboard-panel">
      <div className="panel-header">
        <div>
          <h2>Messages récents</h2>
          <p>Dernières conversations reçues</p>
        </div>

        <button type="button" className="panel-link">
          Voir tout
        </button>
      </div>

      <div className="messages-list">
        {messages.map((message) => (
          <article className="message-item" key={message.id}>
            <div className="message-avatar">
              {message.name
                .split(" ")
                .map((word) => word[0])
                .slice(0, 2)
                .join("")}
            </div>

            <div className="message-content">
              <div className="message-top">
                <strong>{message.name}</strong>
                <span>{message.time}</span>
              </div>

              <p>{message.message}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default RecentMessages;