// Dashboard Navigation Component

'use client';

import { Session } from 'next-auth';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { hasPermission, type Role } from '@/auth/permissions';
import {
  Calendar,
  Users,
  Package,
  FileText,
  Home,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardNav({ user }: { user: Session['user'] }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const userRole = (user as any).role as Role;

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: 'access_system',
    },
    {
      label: 'Appointments',
      href: '/appointments',
      icon: Calendar,
      permission: 'view_appointments',
    },
    {
      label: 'Patients',
      href: '/patients',
      icon: Users,
      permission: 'view_patients',
    },
    {
      label: 'Prescriptions',
      href: '/prescriptions',
      icon: FileText,
      permission: 'view_prescriptions',
    },
    {
      label: 'Invoices',
      href: '/invoices',
      icon: FileText,
      permission: 'view_prescriptions',
    },
    {
      label: 'Tests',
      href: '/tests',
      icon: Package,
      permission: 'view_test_results',
    },
    {
      label: 'Stock Management',
      href: '/stock',
      icon: Package,
      permission: 'view_stock',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      permission: 'access_system',
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    hasPermission(userRole, item.permission as any)
  );

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">Cabinet</h1>
                <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <Link
              href="/notifications"
              className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bell size={20} />
              <span>Notifications</span>
            </Link>
            <button
              onClick={() => signOut({ redirectTo: '/auth/login' })}
              className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
