export default function Dashboard() {
  return (
    <div>
      <h1 className="page-title">Дашборд</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Активные заявки</h3>
          <div className="value">24</div>
        </div>
        <div className="stat-card">
          <h3>Техников на линии</h3>
          <div className="value">8</div>
        </div>
        <div className="stat-card">
          <h3>Завершено сегодня</h3>
          <div className="value">15</div>
        </div>
        <div className="stat-card">
          <h3>Среднее время</h3>
          <div className="value">2.5ч</div>
        </div>
      </div>

      <div className="card">
        <h2>Последние заявки</h2>
        <p>Здесь будет список последних заявок...</p>
      </div>
    </div>
  )
}
