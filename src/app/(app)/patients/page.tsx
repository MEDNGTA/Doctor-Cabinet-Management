'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Pencil, Trash2, Search, Plus } from 'lucide-react';

interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth: string | null;
  gender: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
}

const EDIT_ROLES = ['doctor', 'secretariat', 'it_master', 'it_operator'];
const DELETE_ROLES = ['doctor', 'it_master'];

export default function PatientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || '';
  const canEdit = EDIT_ROLES.includes(userRole);
  const canDelete = DELETE_ROLES.includes(userRole);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [, setDeleteId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPatients = useCallback(async () => {
    if (search.trim().length < 2) {
      setPatients([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}&pageSize=100`);
      const json = await res.json();
      if (json.success) {
        setPatients(json.data?.data || []);
      }
    } catch {
      setError('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchPatients]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSuccess('Patient deleted');
        setPatients((prev) => prev.filter((p) => p.id !== id));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete patient');
    }
    setDeleteId(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    try {
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: editingPatient.firstName,
          lastName: editingPatient.lastName,
          email: editingPatient.email,
          phone: editingPatient.phone,
          dateOfBirth: editingPatient.dateOfBirth,
          gender: editingPatient.gender,
          insuranceProvider: editingPatient.insuranceProvider,
          insuranceNumber: editingPatient.insuranceNumber,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Patient updated');
        setEditingPatient(null);
        fetchPatients();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(json.error || 'Failed to update');
      }
    } catch {
      setError('Failed to update patient');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Patients</h1>
        <Link href="/patients/new" className="btn-primary flex items-center space-x-2">
          <Plus size={18} />
          <span>Add New Patient</span>
        </Link>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Insurance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">Loading patients...</td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      {search.trim().length < 2
                        ? 'Type at least 2 characters to search patients...'
                        : 'No patients found'}
                    </td>
                  </tr>
                ) : (
                  patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="font-medium">{p.firstName} {p.lastName}</td>
                      <td>{p.email || '—'}</td>
                      <td>{p.phone}</td>
                      <td>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '—'}</td>
                      <td className="capitalize">{p.gender || '—'}</td>
                      <td>{p.insuranceProvider || '—'}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {canEdit && (
                            <button
                              onClick={() => setEditingPatient({ ...p })}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Patient</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editingPatient.firstName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editingPatient.lastName}
                    onChange={(e) => setEditingPatient({ ...editingPatient, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editingPatient.email || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Phone *</label>
                  <input
                    type="tel"
                    className="form-input"
                    required
                    value={editingPatient.phone}
                    onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingPatient.dateOfBirth || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, dateOfBirth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Gender</label>
                  <select
                    className="form-input"
                    value={editingPatient.gender || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, gender: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Insurance Provider</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingPatient.insuranceProvider || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, insuranceProvider: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Insurance Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingPatient.insuranceNumber || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, insuranceNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditingPatient(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
