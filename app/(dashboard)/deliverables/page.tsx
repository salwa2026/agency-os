import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import DeliverablesClient from '@/components/deliverables/DeliverablesClient';

export const metadata = { title: 'Deliverables' };

async function getDeliverables(userId: string) {
  return prisma.deliverable.findMany({
    where: { project: { members: { some: { userId } } } },
    include: {
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      approvedBy: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function DeliverablesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const deliverables = await getDeliverables(session.user.id);

  return (
    <>
      <Header title="Deliverables" subtitle={`${deliverables.length} approved outputs`} />
      <DeliverablesClient deliverables={JSON.parse(JSON.stringify(deliverables))} />
    </>
  );
}
