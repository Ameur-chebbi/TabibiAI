function ActivityChart() {
  const data = [
    { day: "Lun", value: 45 },
    { day: "Mar", value: 70 },
    { day: "Mer", value: 55 },
    { day: "Jeu", value: 85 },
    { day: "Ven", value: 65 },
    { day: "Sam", value: 90 },
    { day: "Dim", value: 60 },
  ];

  return (
    <section className="activity-chart">
      <div className="activity-header">
        <div>
          <h2>Activité de la semaine</h2>
          <p>Messages et interactions reçus cette semaine</p>
        </div>

        <span>Cette semaine</span>
      </div>

      <div className="chart-bars">
        {data.map((item) => (
          <div className="chart-item" key={item.day}>
            <div className="bar-wrapper">
              <div
                className="chart-bar"
                style={{ height: `${item.value}%` }}
              />
            </div>

            <span>{item.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ActivityChart;