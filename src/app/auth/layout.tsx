import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Cabinet',
  description: 'Sign in to your doctor cabinet account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
