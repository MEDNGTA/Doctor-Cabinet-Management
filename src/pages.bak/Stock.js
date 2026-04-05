import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const STORAGE_KEY = 'cabinetStock';

export default function Stock() {
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', qty: 1, supplier: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setItems(JSON.parse(saved));
    else setItems([{ id: 1, name: 'Echo heart probe', qty: 10, supplier: 'MedSuppliers' }]);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (e) => {
    e.preventDefault();
    if (!form.name) return;
    setItems((prev) => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: '', qty: 1, supplier: '' });
  };

  return (
    <div className="page">
      <h1>{t.stock}</h1>
      <div className="panel">
        <form className="small-form" onSubmit={addItem}>
          <label>Item name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label>Quantity</label>
          <input type="number" value={form.qty} min={1} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <label>Supplier</label>
          <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <div className="form-actions"><button type="submit">{t.save}</button></div>
        </form>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.qty}</td>
                  <td>{item.supplier}</td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="4">No stock items yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
