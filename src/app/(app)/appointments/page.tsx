'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type Appointment = {
  id: number;
  patientId: number;
  doctorId: number;
  appointmentDate: string;
  duration: number;
  status: string;
  description: string | null;
  notes: string | null;
  patient?: { id: number; firstName: string; lastName: string; phone: string };
  doctor?: { id: number; firstName: string; lastName: string; email: string };
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

const CAN_MANAGE_ROLES = ['doctor', 'secretariat', 'it_master', 'it_operator'];
const CAN_DELETE_ROLES = ['doctor', 'secretariat', 'it_master'];

export default function AppointmentsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || '';
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (dateFrom) params.set('fromDate', dateFrom);
      if (dateTo) params.set('toDate', dateTo);
      params.set('page', String(page));
      params.set('pageSize', '20');
      const res = await fetch(`/api/appointments?${params}`);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data?.data || json.data || []);
        setTotalPages(json.data?.pagination?.totalPages || 1);
        setTotal(json.data?.pagination?.total || 0);
      }
    } catch {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, dateFrom, dateTo, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchAppointments, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, dateFrom, dateTo]);

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: editStatus, notes: editNotes }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        fetchAppointments();
      } else {
        setError(json.message || json.error || 'Failed to update');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchAppointments();
      } else {
        setError(json.message || json.error || 'Failed to delete');
      }
    } catch {
      setError('Network error');
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasFilters = statusFilter || searchQuery || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
        {CAN_MANAGE_ROLES.includes(role) && (
          <Link href="/appointments/new" className="btn-primary">
            + Schedule Appointment
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button onClick={() => setError('')} className="float-right text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search by patient name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Type patient name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
            <input
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
            <input
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s === '' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-red-600">
                Clear filters
              </button>
            )}
            <span className="text-sm text-gray-500">{total} appointment{total !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No appointments found.
            {hasFilters && (
              <button onClick={clearFilters} className="ml-2 text-blue-600 hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date &amp; Time</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td className="font-medium">
                      {apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : `Patient #${apt.patientId}`}
                      {apt.patient?.phone && (
                        <span className="block text-xs text-gray-400">{apt.patient.phone}</span>
                      )}
                    </td>
                    <td>
                      {apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : `Doctor #${apt.doctorId}`}
                    </td>
                    <td>
                      <span className="block">{new Date(apt.appointmentDate).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">{new Date(apt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td>{apt.duration} min</td>
                    <td>{apt.description || '—'}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[apt.status] || 'bg-gray-100'}`}>
                        {apt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {CAN_MANAGE_ROLES.includes(role) && (
                          <button
                            onClick={() => {
                              setEditingId(apt.id);
                              setEditStatus(apt.status);
                              setEditNotes(apt.notes || '');
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Edit
                          </button>
                        )}
                        {CAN_DELETE_ROLES.includes(role) && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingId(null)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Update Appointment</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="form-input">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="form-input" rows={3} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditingId(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleUpdate(editingId)} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
