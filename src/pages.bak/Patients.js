import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'cabinetPatients';

const initialPatients = [
  { id: 1, name: 'John Doe', phone: '+1 555-0100', email: 'john@example.com', dob: '1985-09-12' },
  { id: 2, name: 'Amina Karim', phone: '+49 30 1234 5678', email: 'amina@example.com', dob: '1990-04-20' },
];

export default function Patients() {
  const { t } = useLanguage();
  const [patients, setPatients] = useState([]);
  const [editingPatient, setEditingPatient] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', dob: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPatients(JSON.parse(saved));
      } catch {
        setPatients(initialPatients);
      }
    } else {
      setPatients(initialPatients);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const hasPatients = useMemo(() => patients.length > 0, [patients]);

  function resetForm() {
    setEditingPatient(null);
    setForm({ name: '', phone: '', email: '', dob: '' });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) return;

    if (editingPatient) {
      setPatients((prev) => prev.map((p) => (p.id === editingPatient.id ? { ...p, ...form } : p)));
    } else {
      setPatients((prev) => [...prev, { id: Date.now(), ...form }]);
    }

    resetForm();
  }

  function handleEdit(item) {
    setEditingPatient(item);
    setForm({ name: item.name, phone: item.phone, email: item.email, dob: item.dob });
  }

  function handleDelete(id) {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="page">
      <h1>{t.patients}</h1>
      <div className="panel">
        <form className="small-form" onSubmit={handleSubmit}>
          <h3>{t.addNewPatient}</h3>
          <label>{t.patientName}</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>{t.phone}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label>{t.email}</label>
          <input value={form.email} type="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label>Date of Birth</label>
          <input value={form.dob} type="date" onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{t.save}</button>
            <button type="button" onClick={resetForm}>{t.cancel}</button>
          </div>
        </form>

        <div className="table-container">
          {hasPatients ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t.patientName}</th>
                  <th>{t.phone}</th>
                  <th>Email</th>
                  <th>DOB</th>
                  <th>{t.action}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>{patient.id}</td>
                    <td>{patient.name}</td>
                    <td>{patient.phone}</td>
                    <td>{patient.email}</td>
                    <td>{patient.dob}</td>
                    <td>
                      <button onClick={() => handleEdit(patient)}>{t.save}</button>
                      <button onClick={() => handleDelete(patient.id)}>{t.cancel}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No patients yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
