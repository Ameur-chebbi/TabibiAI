function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </div>
  );
}

export default StatCard;