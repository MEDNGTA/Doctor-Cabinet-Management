'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Menu, X, Globe, LogOut, KeyRound } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { Locale } from '@/lib/i18n';

type AppRole = 'patient' | 'secretariat' | 'doctor' | 'nurse' | 'it_operator' | 'it_master';

const NAVIGATION: Record<AppRole, { name: string; href: string; icon: string }[]> = {
  it_master: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Prescriptions', href: '/prescriptions', icon: '💊' },
    { name: 'Stock', href: '/stock', icon: '📦' },
    { name: 'Suppliers', href: '/suppliers', icon: '🏢' },
  ],
  it_operator: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Stock', href: '/stock', icon: '📦' },
  ],
  doctor: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Prescriptions', href: '/prescriptions', icon: '💊' },
    { name: 'My Team', href: '/team', icon: '👨‍⚕️' },
    { name: 'Stock', href: '/stock', icon: '📦' },
  ],
  secretariat: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Stock', href: '/stock', icon: '📦' },
    { name: 'Suppliers', href: '/suppliers', icon: '🏢' },
  ],
  nurse: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Patients', href: '/patients', icon: '👥' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Stock', href: '/stock', icon: '📦' },
  ],
  patient: [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Appointments', href: '/appointments', icon: '📅' },
    { name: 'Prescriptions', href: '/prescriptions', icon: '💊' },
  ],
};

const LANGUAGE_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const { locale, setLocale, t } = useLanguage();

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    // Redirect immediately for snappy UX, signOut handles cleanup
    router.push('/auth/login');
    await signOut({ redirect: false });
  }, [router]);

  const handleLanguageChange = useCallback((code: Locale) => {
    setLocale(code);
    setLangMenuOpen(false);
  }, [setLocale]);

  const handleChangePassword = useCallback(async () => {
    setPasswordMsg({ type: '', text: '' });
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMsg({ type: 'error', text: 'All fields are required' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setShowPasswordModal(false), 1500);
      } else {
        setPasswordMsg({ type: 'error', text: json.message || json.error || 'Failed to update password' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error' });
    } finally {
      setSavingPassword(false);
    }
  }, [passwordForm]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = ((session?.user as any)?.role || 'patient') as AppRole;
  const navigationItems = NAVIGATION[userRole] || NAVIGATION.patient;
  const canChangePassword = !['nurse', 'secretariat'].includes(userRole);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 hover:bg-slate-100"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <Link href="/dashboard" className="flex items-center space-x-3 ml-4 md:ml-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="font-bold text-xl text-slate-900 hidden sm:inline">Cabinet</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                  title="Change language"
                >
                  <Globe size={16} />
                  <span className="hidden sm:inline">{LANGUAGE_OPTIONS.find(l => l.code === locale)?.flag}</span>
                  <span className="hidden sm:inline text-xs uppercase">{locale}</span>
                </button>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-50 py-1">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center space-x-2 ${
                            locale === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {session?.user && (
                <>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  {canChangePassword && (
                    <button
                      onClick={() => { setShowPasswordModal(true); setPasswordMsg({ type: '', text: '' }); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
                      title="Change password"
                    >
                      <KeyRound size={16} />
                      <span className="hidden sm:inline">Password</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center space-x-1 px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">{loggingOut ? '...' : t.logout}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 bg-slate-900 text-white min-h-screen fixed md:relative top-16 md:top-0 left-0 z-40 md:z-0 shadow-lg`}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full md:w-auto">
          <div className="container-main py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            {passwordMsg.text && (
              <div className={`mb-4 px-4 py-2 rounded text-sm ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleChangePassword} disabled={savingPassword} className="btn-primary disabled:opacity-50">
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
