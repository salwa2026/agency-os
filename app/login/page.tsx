import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import LoginClient from '@/components/auth/LoginClient';

export const metadata = { title: 'Sign In · Agency OS' };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  // 🔒 si déjà connecté → redirect
  if (session?.user) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <LoginClient />
    </div>
  );
}