import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!username || !password) return;
    alert('Registration simulated: ' + username);
    navigate('/login');
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h2>{t.registerBtn}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="register-username">{t.usernameOrEmail}</label>
            <input
              id="register-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.usernameOrEmail}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">{t.password}</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
            />
          </div>

          <div className="form-actions">
            <button type="submit">{t.registerBtn}</button>
            <button type="button" onClick={() => navigate('/login')} className="secondary">
              {t.backToLoginBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
