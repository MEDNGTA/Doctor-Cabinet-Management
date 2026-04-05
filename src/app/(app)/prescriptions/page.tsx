'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type PrescriptionDetail = {
  id: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
};

type Prescription = {
  id: number;
  patientId: number;
  doctorId: number;
  prescriptionDate: string;
  status: string;
  notes: string | null;
  patient?: { id: number; firstName: string; lastName: string };
  doctor?: { id: number; firstName: string; lastName: string };
  details?: PrescriptionDetail[];
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  issued: 'bg-blue-100 text-blue-800',
  printed: 'bg-green-100 text-green-800',
};

const CAN_CREATE_ROLES = ['doctor'];
const CAN_EDIT_ROLES = ['doctor', 'it_master'];
const CAN_DELETE_ROLES = ['doctor', 'it_master'];

export default function PrescriptionsPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || '';
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPrescriptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('pageSize', '50');
      const res = await fetch(`/api/prescriptions?${params}`);
      const json = await res.json();
      if (json.success) {
        setPrescriptions(json.data?.data || json.data || []);
      }
    } catch {
      setError('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) fetchPrescriptions();
      else setError(json.message || 'Failed to update');
    } catch {
      setError('Network error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this prescription?')) return;
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchPrescriptions();
      else setError(json.message || 'Failed to delete');
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Prescriptions</h1>
        {CAN_CREATE_ROLES.includes(role) && (
          <Link href="/prescriptions/new" className="btn-primary">
            + Create Prescription
          </Link>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="flex gap-2">
        {['', 'draft', 'issued', 'printed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading prescriptions...</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No prescriptions found</div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Medications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="group">
                    <td className="font-medium">
                      {rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : `Patient #${rx.patientId}`}
                    </td>
                    <td>
                      {rx.doctor ? `Dr. ${rx.doctor.firstName} ${rx.doctor.lastName}` : `Doctor #${rx.doctorId}`}
                    </td>
                    <td>{new Date(rx.prescriptionDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[rx.status] || 'bg-gray-100'}`}>
                        {rx.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setExpandedId(expandedId === rx.id ? null : rx.id)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {rx.details?.length || 0} item(s) {expandedId === rx.id ? '▲' : '▼'}
                      </button>
                      {expandedId === rx.id && rx.details && rx.details.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-xs space-y-1">
                          {rx.details.map((d) => (
                            <div key={d.id}>
                              <strong>{d.medicationName}</strong> — {d.dosage}, {d.frequency}, {d.duration}
                              {d.instructions && <span className="text-gray-500"> ({d.instructions})</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2 flex-wrap">
                        {CAN_EDIT_ROLES.includes(role) && rx.status === 'draft' && (
                          <button
                            onClick={() => handleStatusUpdate(rx.id, 'issued')}
                            className="text-green-600 hover:underline text-sm"
                          >
                            Issue
                          </button>
                        )}
                        {rx.status === 'issued' && (
                          <button
                            onClick={() => handleStatusUpdate(rx.id, 'printed')}
                            className="text-purple-600 hover:underline text-sm"
                          >
                            Print
                          </button>
                        )}
                        {CAN_DELETE_ROLES.includes(role) && rx.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(rx.id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Delete
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
    </div>
  );
}
