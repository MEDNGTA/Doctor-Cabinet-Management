import { BrowserRouter, Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import About from './pages/About';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Prescriptions from './pages/Prescriptions';
import Stock from './pages/Stock';
import Suppliers from './pages/Suppliers';
import Unauthorized from './pages/Unauthorized';

function AppShell() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t, isRtl } = useLanguage();
  const location = useLocation();
  const publicPages = ['/home', '/services', '/suppliers', '/about', '/login', '/register'];
  const showSidebar = !publicPages.includes(location.pathname) && user;

  return (
    <div className={`App app-root ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="main-header">
        <h1>{t.appTitle}</h1>
        {user ? (
          <div className="top-actions">
            <span>{user.name} ({user.role})</span>
            <button onClick={logout}>{t.logoutBtn}</button>
            <select value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        ) : null}
      </header>

      <div className="layout">
        {showSidebar && (
          <nav className="sidebar">
            <ul>
              <li><Link to="/home">Home</Link></li>
              <li><Link to="/services">Services</Link></li>
              <li><Link to="/suppliers">Suppliers</Link></li>
              <li><Link to="/about">About Us</Link></li>
            </ul>
          </nav>
        )}

        <main className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/stock" element={<Stock />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
              <Route path="/prescriptions" element={<Prescriptions />} />
            </Route>

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppShell />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

