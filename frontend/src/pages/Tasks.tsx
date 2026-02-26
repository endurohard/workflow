export default function Tasks() {
  const tasks = [
    { id: 1, title: 'Ремонт холодильника', client: 'Иванов И.И.', status: 'new' },
    { id: 2, title: 'Установка кондиционера', client: 'Петров П.П.', status: 'in-progress' },
    { id: 3, title: 'Ремонт стиральной машины', client: 'Сидоров С.С.', status: 'completed' },
  ]

  return (
    <div>
      <h1 className="page-title">Заявки</h1>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.client}</td>
                <td>
                  <span className={`status-badge status-${task.status}`}>
                    {task.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-primary">Открыть</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
