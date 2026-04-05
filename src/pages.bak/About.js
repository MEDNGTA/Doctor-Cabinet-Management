import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();
  return (
    <div className="page">
      <h1>About Us</h1>
      <p>
        This system helps a medical cabinet to manage patients, appointments, stock, suppliers, and prescriptions.
      </p>
    </div>
  );
}
