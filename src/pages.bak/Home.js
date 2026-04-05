import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="home-container">
      <nav className="home-navbar">
        <div className="navbar-logo">{t.appTitle}</div>
        <div className="navbar-actions">
          {user ? (
            <span className="user-info">{user.name}</span>
          ) : (
            <>
              <Link to="/login" className="nav-btn-login">
                {t.loginBtn}
              </Link>
              <Link to="/register" className="nav-btn-register">
                {t.registerBtn}
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <h1>{t.appTitle}</h1>
          <p className="hero-subtitle">{t.subtitle}</p>
          {!user && (
            <Link to="/login" className="hero-cta">
              {t.loginBtn}
            </Link>
          )}
        </div>
      </section>

      <section className="features-section">
        <h2>Core Services</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon">📅</div>
            <h3>{t.onlineAppointments}</h3>
            <p>Manage online appointment bookings and scheduling.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <h3>{t.patientManagement}</h3>
            <p>Maintain comprehensive patient records and history.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📋</div>
            <h3>{t.createPrescription}</h3>
            <p>Create, manage, and print prescriptions easily.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">📦</div>
            <h3>{t.stockManagement}</h3>
            <p>Track medical supplies and equipment inventory.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">🤝</div>
            <h3>{t.buySuppliers}</h3>
            <p>Manage supplier relationships and orders.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">⚙️</div>
            <h3>Management Dashboard</h3>
            <p>Comprehensive control panel for all cabinet operations.</p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="info-block">
          <h3>Multilingual Support</h3>
          <p>Available in English, German, French, and Arabic with RTL support.</p>
        </div>
        <div className="info-block">
          <h3>Role-Based Access</h3>
          <p>Separate workflows for doctors and secretaries.</p>
        </div>
        <div className="info-block">
          <h3>Secure Platform</h3>
          <p>Professional-grade cabinet management system.</p>
        </div>
      </section>

      <footer className="home-footer">
        <p>&copy; 2026 {t.appTitle}. All rights reserved.</p>
      </footer>
    </div>
  );
}

