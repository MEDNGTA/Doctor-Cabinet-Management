import type { Metadata } from 'next';
import Link from 'next/link';
import { auth } from '@/auth/config';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Home - Cabinet',
};

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container-main flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">Cabinet</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="container-main py-20 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-4">
          Doctor Cabinet Management
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Smart clinic dashboard for managing appointments, patients, prescriptions, and inventory.
          Streamline your medical practice with our comprehensive management system.
        </p>
        <div className="space-x-4">
          <Link href="/auth/login" className="btn-primary">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn-secondary">
            Create Account
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="container-main py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid-responsive">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">👥 Patient Management</h3>
            <p className="text-slate-600">Comprehensive patient database with medical history, insurance, and contact information.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">📅 Appointments</h3>
            <p className="text-slate-600">Schedule and manage appointments with automatic reminders and calendar integration.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">💊 Prescriptions</h3>
            <p className="text-slate-600">Create, manage, and print prescriptions with medication details and patient information.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">📦 Stock Management</h3>
            <p className="text-slate-600">Track medical supplies and equipment with low stock alerts and reorder functionality.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">🏢 Supplier Management</h3>
            <p className="text-slate-600">Manage supplier information and purchase history for efficient procurement.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-2">🔐 Role-Based Access</h3>
            <p className="text-slate-600">Flexible role management for doctors, secretaries, and administrators.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="container-main text-center">
          <p>&copy; 2024 Cabinet Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
