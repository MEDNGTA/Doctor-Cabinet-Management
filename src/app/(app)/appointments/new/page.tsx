'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Doctor = { id: number; firstName: string; lastName: string };
type Patient = { id: number; firstName: string; lastName: string; phone: string };
type Appointment = { id: number; appointmentDate: string; duration: number; status: string };

const APPOINTMENT_TYPES = [
  'General Check-up',
  'Follow-up',
  'Consultation',
  'Emergency',
  'Lab Test',
  'Vaccination',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Other',
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  return days;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);

  // Form state
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  // Calendar
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const todayKey = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  // Auto-select if current user is a doctor
  useEffect(() => {
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;
    if (role === 'doctor' && userId) {
      setSelectedDoctorId(parseInt(userId));
      // Fetch this doctor's info
      fetch(`/api/users?role=doctor`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            const me = json.data.find((d: Doctor) => d.id === parseInt(userId));
            if (me) {
              setDoctors([me]);
              setDoctorSearch(`Dr. ${me.firstName} ${me.lastName}`);
            }
          }
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Search doctors
  useEffect(() => {
    // Skip search if a doctor is already selected 
    if (selectedDoctorId) return;
    if (doctorSearch.trim().length < 1) {
      setDoctors([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/users?role=doctor&search=${encodeURIComponent(doctorSearch)}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) setDoctors(json.data);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [doctorSearch, selectedDoctorId]);

  // Search patients (only when typing)
  useEffect(() => {
    if (patientSearch.trim().length < 1) {
      setPatients([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(patientSearch)}&pageSize=20`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success) setPatients(json.data?.data || json.data || []);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  // Fetch appointments for the selected date to show busy slots
  useEffect(() => {
    if (!selectedDate || !selectedDoctorId) {
      setDayAppointments([]);
      return;
    }
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const params = new URLSearchParams({
      doctorId: String(selectedDoctorId),
      fromDate: selectedDate,
      toDate: nextDay.toISOString().split('T')[0],
      pageSize: '50',
    });
    fetch(`/api/appointments?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const list = json.data?.data || json.data || [];
          setDayAppointments(list.filter((a: Appointment) => a.status !== 'cancelled'));
        }
      })
      .catch(() => {});
  }, [selectedDate, selectedDoctorId]);

  const busySlots = useMemo(() => {
    const busy = new Set<string>();
    dayAppointments.forEach((apt) => {
      const start = new Date(apt.appointmentDate);
      const mins = apt.duration || 30;
      for (let m = 0; m < mins; m += 30) {
        const t = new Date(start.getTime() + m * 60000);
        const slot = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        busy.add(slot);
      }
    });
    return busy;
  }, [dayAppointments]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  const handlePrevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };

  const handleNextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };

  const handleSelectDay = (day: number) => {
    const key = formatDateKey(calYear, calMonth, day);
    // Don't allow past dates
    if (key < todayKey) return;
    setSelectedDate(key);
    setSelectedTime('');
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedPatientId) return setError('Please select a patient');
    if (!selectedDoctorId) return setError('Please select a doctor');
    if (!selectedDate) return setError('Please select a date');
    if (!selectedTime) return setError('Please select a time');
    if (!appointmentType) return setError('Please select an appointment type');

    setLoading(true);
    try {
      const appointmentDate = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: selectedDoctorId,
          appointmentDate,
          duration,
          description: appointmentType,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccess('Appointment scheduled successfully!');
        setTimeout(() => router.push('/appointments'), 1500);
      } else {
        setError(json.message || json.error || 'Failed to schedule appointment');
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
        <Link href="/appointments" className="text-blue-600 hover:underline">
          ← Back to Appointments
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Schedule Appointment</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Patient & Doctor Selection + Type */}
        <div className="space-y-6">
          {/* Patient Search */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Select Patient</h2>
            <div className="relative">
              <input
                type="text"
                className="form-input"
                placeholder="Search patient by name..."
                value={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatientId(null);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
              />
              {showPatientDropdown && !selectedPatientId && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {patientSearch.trim().length < 1 ? (
                    <div className="p-3 text-gray-500 text-sm">Type to search patients...</div>
                  ) : patients.length === 0 ? (
                    <div className="p-3 text-gray-500 text-sm">No patients found</div>
                  ) : (
                    patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 flex justify-between items-center"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPatientSearch('');
                          setShowPatientDropdown(false);
                        }}
                      >
                        <span className="font-medium">{p.firstName} {p.lastName}</span>
                        <span className="text-xs text-gray-400">{p.phone}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedPatient && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg"
                  onClick={() => { setSelectedPatientId(null); setPatientSearch(''); }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Doctor */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Select Doctor</h2>
            <div className="relative">
              <input
                type="text"
                className="form-input"
                placeholder="Search doctor by name..."
                value={selectedDoctorId && doctors.find(d => d.id === selectedDoctorId) ? `Dr. ${doctors.find(d => d.id === selectedDoctorId)!.firstName} ${doctors.find(d => d.id === selectedDoctorId)!.lastName}` : doctorSearch}
                onChange={(e) => {
                  setDoctorSearch(e.target.value);
                  setSelectedDoctorId(null);
                  setShowDoctorDropdown(true);
                }}
                onFocus={() => setShowDoctorDropdown(true)}
              />
              {showDoctorDropdown && !selectedDoctorId && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {doctorSearch.trim().length < 1 ? (
                    <div className="p-3 text-gray-500 text-sm">Type to search doctors...</div>
                  ) : doctors.length === 0 ? (
                    <div className="p-3 text-gray-500 text-sm">No doctors found</div>
                  ) : (
                    doctors.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedDoctorId(d.id);
                          setDoctorSearch('');
                          setShowDoctorDropdown(false);
                        }}
                      >
                        <span className="font-medium">Dr. {d.firstName} {d.lastName}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedDoctorId && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg"
                  onClick={() => { setSelectedDoctorId(null); setDoctorSearch(''); }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Appointment Type */}
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Appointment Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {APPOINTMENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAppointmentType(type)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    appointmentType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Duration & Notes */}
          <div className="bg-white rounded-lg shadow p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                className="form-input"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <textarea
                className="form-input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
        </div>

        {/* CENTER: Calendar */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Choose Date</h2>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              ◀
            </button>
            <span className="font-semibold text-gray-900">
              {MONTHS[calMonth]} {calYear}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
              ▶
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-xs font-semibold text-gray-500 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const key = formatDateKey(calYear, calMonth, day);
              const isPast = key < todayKey;
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isPast}
                  onClick={() => handleSelectDay(day)}
                  className={`py-2 rounded-lg text-sm font-medium transition ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isToday
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : isPast
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              Selected: <strong>{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
            </div>
          )}
        </div>

        {/* RIGHT: Time Slots */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Choose Time</h2>
          {!selectedDate ? (
            <p className="text-gray-400 text-sm">Select a date first</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => {
                const isBusy = busySlots.has(slot);
                const isSelected = slot === selectedTime;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBusy}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : isBusy
                        ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed line-through'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
              Time: <strong>{selectedTime}</strong> — {duration} min
            </div>
          )}
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Appointment Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-500 block">Patient</span>
            <strong>{selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '—'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Doctor</span>
            <strong>{selectedDoctorId ? `Dr. ${doctors.find(d => d.id === selectedDoctorId)?.firstName || ''} ${doctors.find(d => d.id === selectedDoctorId)?.lastName || ''}` : '—'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Date</span>
            <strong>{selectedDate ? new Date(selectedDate + 'T00:00').toLocaleDateString() : '—'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Time</span>
            <strong>{selectedTime || '—'}</strong>
          </div>
          <div>
            <span className="text-gray-500 block">Type</span>
            <strong>{appointmentType || '—'}</strong>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Link href="/appointments" className="btn-secondary">Cancel</Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !selectedPatientId || !selectedDoctorId || !selectedDate || !selectedTime || !appointmentType}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
