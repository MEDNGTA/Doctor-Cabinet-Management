import { useLanguage } from '../context/LanguageContext';

export default function Unauthorized() {
  const { t } = useLanguage();
  return (
    <div className="page">
      <h1>{t.unauthorized}</h1>
      <p>You do not have permission to access this page.</p>
    </div>
  );
}
