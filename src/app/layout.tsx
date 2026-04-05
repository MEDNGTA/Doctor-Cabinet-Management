import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Cabinet - Doctor Management System',
  description: 'Modern doctor cabinet management system with appointments, patients, prescriptions, and stock management.',
  keywords: 'doctor, cabinet, management, appointments, patients, prescriptions',
  openGraph: {
    title: 'Cabinet - Doctor Management System',
    description: 'Smart clinic dashboard for appointments, patients, and stock',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
