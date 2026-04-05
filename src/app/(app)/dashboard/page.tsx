// Comprehensive Role-Based Dashboard

import type { Metadata } from 'next';
import { auth } from '@/auth/config';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { appointments, patients } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { format } from 'date-fns';

export const metadata: Metadata = {
  title: 'Dashboard - Cabinet',
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const userRole = (session.user as any).role;

  // Fetch common data
  const [{ count: totalPatients }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(patients);

  const upcomingAppointments = await db.query.appointments.findMany({
    where: eq(appointments.status, 'pending'),
    limit: 5,
    orderBy: [desc(appointments.appointmentDate)],
    with: {
      patient: {
        columns: { firstName: true, lastName: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {session.user.name}!
        </h1>
        <p className="text-gray-600">
          Role: <span className="font-semibold capitalize">{userRole.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Patients" value={totalPatients} icon="👥" />
        <MetricCard
          title="Upcoming Appointments"
          value={upcomingAppointments.length}
          icon="📅"
        />
        <MetricCard title="Pending Invoices" value="--" icon="💰" />
        <MetricCard title="Stock Alerts" value="--" icon="⚠️" />
      </div>

      {/* Role-Specific Content */}
      {userRole === 'patient' && <PatientDashboardSection />}
      {userRole === 'doctor' && <DoctorDashboardSection />}
      {userRole === 'secretariat' && <SecretariatDashboardSection />}
      {userRole === 'nurse' && <NurseDashboardSection />}
      {['it_operator', 'it_master'].includes(userRole) && <AdminDashboardSection />}

      {/* Recent Appointments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">
                    {apt.patient.firstName} {apt.patient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(apt.appointmentDate), 'PPP p')}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">No upcoming appointments</p>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon }: { title: string; value: any; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}

// Role-Specific Dashboard Sections
function PatientDashboardSection() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-blue-900 mb-3">Patient Portal</h2>
      <ul className="space-y-2 text-blue-800">
        <li>✓ Book your next appointment</li>
        <li>✓ View your medical history</li>
        <li>✓ Track test results</li>
        <li>✓ Manage prescriptions</li>
      </ul>
    </div>
  );
}

function DoctorDashboardSection() {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-green-900 mb-3">Doctor Command Center</h2>
      <ul className="space-y-2 text-green-800">
        <li>✓ Review patient appointments</li>
        <li>✓ Create prescriptions and tests</li>
        <li>✓ Approve invoices</li>
        <li>✓ Manage staff and tests</li>
      </ul>
    </div>
  );
}

function SecretariatDashboardSection() {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-purple-900 mb-3">Secretariat Dashboard</h2>
      <ul className="space-y-2 text-purple-800">
        <li>✓ Manage appointments</li>
        <li>✓ Create and manage invoices</li>
        <li>✓ Track stock and supplies</li>
        <li>✓ Print documents</li>
      </ul>
    </div>
  );
}

function NurseDashboardSection() {
  return (
    <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-pink-900 mb-3">Nurse Station</h2>
      <ul className="space-y-2 text-pink-800">
        <li>✓ Perform assigned tests</li>
        <li>✓ Notify doctors of results</li>
        <li>✓ Manage consumables</li>
        <li>✓ Track patient sessions</li>
      </ul>
    </div>
  );
}

function AdminDashboardSection() {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-indigo-900 mb-3">Admin Control Panel</h2>
      <ul className="space-y-2 text-indigo-800">
        <li>✓ Manage all users and roles</li>
        <li>✓ View audit logs</li>
        <li>✓ System configuration</li>
        <li>✓ Generate reports</li>
      </ul>
    </div>
  );
}
