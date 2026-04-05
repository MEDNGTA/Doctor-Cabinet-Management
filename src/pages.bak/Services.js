import { useLanguage } from '../context/LanguageContext';

export default function Services() {
  const { t } = useLanguage();
  return (
    <div className="page">
      <h1>Services</h1>
      <p>
        Manage online appointments, appointment scheduling, stock monitoring, and more.
      </p>
    </div>
  );
}
