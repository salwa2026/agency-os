import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Header from '@/components/layout/Header';
import SettingsClient from '@/components/settings/SettingsClient';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  return (
    <>
      <Header title="Settings" />
      <SettingsClient user={session.user} />
    </>
  );
}
