'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const body = {
      firstName: form.get('firstName') as string,
      lastName: form.get('lastName') as string,
      email: (form.get('email') as string) || undefined,
      phone: (form.get('phone') as string) || undefined,
      dateOfBirth: (form.get('dateOfBirth') as string) || undefined,
      gender: (form.get('gender') as string) || undefined,
      address: (form.get('address') as string) || undefined,
      city: (form.get('city') as string) || undefined,
      country: (form.get('country') as string) || undefined,
      medicalHistory: (form.get('medicalHistory') as string) || undefined,
      allergies: (form.get('allergies') as string) || undefined,
      insuranceNumber: (form.get('insuranceNumber') as string) || undefined,
      insuranceProvider: (form.get('insuranceProvider') as string) || undefined,
      emergencyContactName: (form.get('emergencyContactName') as string) || undefined,
      emergencyContactPhone: (form.get('emergencyContactPhone') as string) || undefined,
      notes: (form.get('notes') as string) || undefined,
    };

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        router.push('/patients');
      } else {
        setError(json.message || json.error || 'Failed to create patient');
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
        <Link href="/patients" className="text-blue-600 hover:underline">
          ← Back to Patients
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Add New Patient</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="form-label">First Name *</label>
              <input id="firstName" name="firstName" type="text" className="form-input" required />
            </div>
            <div>
              <label htmlFor="lastName" className="form-label">Last Name *</label>
              <input id="lastName" name="lastName" type="text" className="form-input" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="form-label">Email</label>
              <input id="email" name="email" type="email" className="form-input" />
            </div>
            <div>
              <label htmlFor="phone" className="form-label">Phone *</label>
              <input id="phone" name="phone" type="tel" className="form-input" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
              <input id="dateOfBirth" name="dateOfBirth" type="date" className="form-input" />
            </div>
            <div>
              <label htmlFor="gender" className="form-label">Gender</label>
              <select id="gender" name="gender" className="form-input">
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address" className="form-label">Address</label>
              <input id="address" name="address" type="text" className="form-input" />
            </div>
            <div>
              <label htmlFor="city" className="form-label">City</label>
              <input id="city" name="city" type="text" className="form-input" />
            </div>
          </div>

          <div>
            <label htmlFor="medicalHistory" className="form-label">Medical History</label>
            <textarea id="medicalHistory" name="medicalHistory" className="form-input" rows={3} placeholder="Any known conditions..." />
          </div>

          <div>
            <label htmlFor="allergies" className="form-label">Allergies</label>
            <input id="allergies" name="allergies" type="text" className="form-input" placeholder="e.g., Penicillin, Peanuts" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="insuranceNumber" className="form-label">Insurance Number</label>
              <input id="insuranceNumber" name="insuranceNumber" type="text" className="form-input" />
            </div>
            <div>
              <label htmlFor="insuranceProvider" className="form-label">Insurance Provider</label>
              <input id="insuranceProvider" name="insuranceProvider" type="text" className="form-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="emergencyContactName" className="form-label">Emergency Contact Name</label>
              <input id="emergencyContactName" name="emergencyContactName" type="text" className="form-input" />
            </div>
            <div>
              <label htmlFor="emergencyContactPhone" className="form-label">Emergency Contact Phone</label>
              <input id="emergencyContactPhone" name="emergencyContactPhone" type="tel" className="form-input" />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="form-label">Additional Notes</label>
            <textarea id="notes" name="notes" className="form-input" rows={3} />
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/patients" className="btn-secondary">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
              {loading ? 'Saving...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
