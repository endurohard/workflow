export default function Login() {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', marginTop: '4rem' }}>
      <div className="card">
        <h1 className="page-title" style={{ textAlign: 'center' }}>Вход</h1>
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input type="email" style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Пароль</label>
            <input type="password" style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  )
}
