import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'cabinetSuppliers';

export default function Suppliers() {
  const { t } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', contact: '', email: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSuppliers(JSON.parse(saved));
    else setSuppliers([{ id: 1, name: 'MedSuppliers', contact: '+49 555 123 456' }]);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
  }, [suppliers]);

  const addSupplier = (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSuppliers((prev) => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: '', contact: '', email: '' });
  };

  return (
    <div className="page">
      <h1>{t.suppliers}</h1>
      <div className="panel">
        <form className="small-form" onSubmit={addSupplier}>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Contact</label>
          <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="form-actions"><button type="submit">Add</button></div>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.name}</td>
                  <td>{s.contact}</td>
                  <td>{s.email}</td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan="4">No suppliers yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
