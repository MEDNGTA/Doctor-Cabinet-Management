import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'cabinetAppointments';

export default function Appointments() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', date: '', time: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAppointments(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  }, [appointments]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.patient || !form.doctor || !form.date) return;
    const newAppointment = { id: Date.now(), ...form, status: 'pending' };
    setAppointments((prev) => [...prev, newAppointment]);
    setForm({ patient: '', doctor: '', date: '', time: '' });
  };

  const updateStatus = (id, status) => setAppointments((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

  return (
    <div className="page">
      <h1>{t.appointments}</h1>
      <div className="panel">
        <form className="small-form" onSubmit={submit}>
          <label>Patient</label>
          <input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />
          <label>Doctor</label>
          <input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} />
          <label>Date</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label>Time</label>
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <div className="form-actions">
            <button type="submit">{t.save}</button>
          </div>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>{t.action}</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.patient}</td>
                  <td>{a.doctor}</td>
                  <td>{a.date}</td>
                  <td>{a.time}</td>
                  <td>{a.status}</td>
                  <td>
                    <button onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
                    <button onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
                    <button onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan="7">No appointments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
