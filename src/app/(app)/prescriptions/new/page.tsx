'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Predefined medication list
const COMMON_MEDICATIONS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Metformin',
  'Omeprazole',
  'Ciprofloxacin',
  'Diclofenac',
  'Metronidazole',
  'Azithromycin',
  'Cetirizine',
  'Salbutamol',
  'Losartan',
  'Amlodipine',
  'Atorvastatin',
  'Dexamethasone',
];

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  '3 times daily',
  '4 times daily',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'Before meals',
  'After meals',
  'At bedtime',
];

const DURATIONS = [
  '3 days',
  '5 days',
  '7 days',
  '10 days',
  '14 days',
  '21 days',
  '30 days',
  '60 days',
  '90 days',
  'Ongoing',
];

type Medication = {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type Patient = { id: number; firstName: string; lastName: string };

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [medications, setMedications] = useState<Medication[]>([
    { medicationName: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' },
  ]);

  useEffect(() => {
    if (patientSearch.length < 2) return;
    const timer = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&pageSize=10`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setPatients(json.data?.data || json.data || []);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  const addMedication = () => {
    setMedications([
      ...medications,
      { medicationName: '', dosage: '', frequency: 'Once daily', duration: '7 days', instructions: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    if (medications.length === 1) return;
    setMedications(medications.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validMeds = medications.filter((m) => m.medicationName && m.dosage);
    if (!patientId || validMeds.length === 0) {
      setError('Please select a patient and add at least one medication with dosage');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: parseInt(patientId),
          medications: validMeds,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/prescriptions');
      } else {
        setError(json.message || json.error || 'Failed to create prescription');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/prescriptions" className="text-blue-600 hover:underline">
          ← Back to Prescriptions
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Create Prescription</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Patient</h2>
          <div>
            <label className="form-label">Search Patient *</label>
            <input
              type="text"
              className="form-input mb-2"
              placeholder="Type patient name..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <select
              className="form-input"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
            >
              <option value="">Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Medications</h2>
            <button type="button" onClick={addMedication} className="btn-secondary text-sm">
              + Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {medications.map((med, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Medication #{index + 1}</span>
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Medication Name *</label>
                    <input
                      type="text"
                      list={`meds-${index}`}
                      className="form-input"
                      value={med.medicationName}
                      onChange={(e) => updateMedication(index, 'medicationName', e.target.value)}
                      placeholder="Select or type..."
                      required
                    />
                    <datalist id={`meds-${index}`}>
                      {COMMON_MEDICATIONS.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="form-label">Dosage *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={med.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      placeholder="e.g., 500mg, 10ml"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Frequency *</label>
                    <select
                      className="form-input"
                      value={med.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    >
                      {FREQUENCIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Duration *</label>
                    <select
                      className="form-input"
                      value={med.duration}
                      onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                    >
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Special Instructions</label>
                  <input
                    type="text"
                    className="form-input"
                    value={med.instructions}
                    onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                    placeholder="e.g., Take with food, Avoid alcohol"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="General notes for the prescription..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/prescriptions" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
}
