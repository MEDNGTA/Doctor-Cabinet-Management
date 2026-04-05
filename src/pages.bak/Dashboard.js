import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="page">
      <h1>{t.dashboard}</h1>
      <p>
        {t.subtitle}
      </p>

      <div className="cards-grid">
        <article className="card">
          <h3>{t.onlineAppointments}</h3>
          <p>{t.appointmentManagement}</p>
        </article>
        <article className="card">
          <h3>{t.stockManagement}</h3>
          <p>{t.buySuppliers}</p>
        </article>
        <article className="card">
          <h3>{t.patientManagement}</h3>
          <p>{t.patients}</p>
        </article>
        <article className="card">
          <h3>{t.prescriptions}</h3>
          <p>{t.createPrescription}</p>
        </article>
      </div>

      <p className="small">{user?.name} ({user?.role})</p>
    </div>
  );
}
