import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!username || !password) {
      setError('Please enter username/email and password');
      return;
    }

    login({ username, password });
    navigate('/dashboard');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <h2>{t.loginTitle}</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-username">{t.usernameOrEmail}</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder={t.usernameOrEmail}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">{t.password}</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={t.password}
            />
          </div>

          {error && (
            <p className="field-error" role="alert" aria-live="assertive">
              {t.loginError}
            </p>
          )}

          <div className="form-actions">
            <button type="submit">{t.loginBtn}</button>
            <button type="button" className="secondary" onClick={handleRegister}>
              {t.registerBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
