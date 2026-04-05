import type { Metadata } from 'next';
import { auth } from '@/auth/config';
import { redirect } from 'next/navigation';
import AuthProvider from '@/components/providers/auth-provider';
import AppShell from '@/components/layouts/app-shell';

export const metadata: Metadata = {
  title: 'Dashboard - Cabinet',
  description: 'Doctor cabinet management dashboard',
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
