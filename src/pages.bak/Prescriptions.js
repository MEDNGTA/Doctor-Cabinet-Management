import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'cabinetPrescriptions';

export default function Prescriptions() {
  const { t } = useLanguage();
  const [prescriptions, setPrescriptions] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', medication: '', instructions: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setPrescriptions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prescriptions));
  }, [prescriptions]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.patient || !form.doctor || !form.medication) return;
    const item = { id: Date.now(), date: new Date().toLocaleDateString(), ...form };
    setPrescriptions((prev) => [item, ...prev]);
    setForm({ patient: '', doctor: '', medication: '', instructions: '' });
  };

  return (
    <div className="page">
      <h1>{t.prescriptions}</h1>

      <div className="panel">
        <form className="small-form" onSubmit={handleSubmit}>
          <label>{t.patientName}</label>
          <input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />

          <label>{t.doctor}</label>
          <input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} />

          <label>Medication</label>
          <input value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} />

          <label>Instructions</label>
          <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />

          <div className="form-actions">
            <button type="submit">{t.createPrescription}</button>
          </div>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>{t.patientName}</th>
                <th>{t.doctor}</th>
                <th>Date</th>
                <th>Medication</th>
                <th>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {prescriptions.length > 0 ? prescriptions.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.patient}</td>
                  <td>{p.doctor}</td>
                  <td>{p.date}</td>
                  <td>{p.medication}</td>
                  <td>
                    <button onClick={() => {
                      const printWindow = window.open('', '_blank');
                      printWindow.document.write('<html><head><title>Prescription</title></head><body>');
                      printWindow.document.write(`<h2>${t.printPrescription}</h2>`);
                      printWindow.document.write(`<p><strong>${t.patientName}:</strong> ${p.patient}</p>`);
                      printWindow.document.write(`<p><strong>${t.doctor}:</strong> ${p.doctor}</p>`);
                      printWindow.document.write(`<p><strong>Medication:</strong> ${p.medication}</p>`);
                      printWindow.document.write(`<p><strong>Instructions:</strong> ${p.instructions}</p>`);
                      printWindow.document.write('</body></html>');
                      printWindow.document.close();
                      printWindow.print();
                    }}>{t.printPrescription}</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6">No prescriptions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
