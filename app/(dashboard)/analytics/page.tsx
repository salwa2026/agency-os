import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import AnalyticsClient from '@/components/analytics/AnalyticsClient';

export const metadata = { title: 'Analytics' };

async function getAnalyticsData(userId: string) {
  const [taskStats, agentStats, deliverableCount, projectCount] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { project: { members: { some: { userId } } } },
      _count: { id: true },
    }),
    prisma.agentCommand.groupBy({
      by: ['agentType'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 11,
    }),
    prisma.deliverable.count({
      where: { project: { members: { some: { userId } } } },
    }),
    prisma.project.count({
      where: { members: { some: { userId } } },
    }),
  ]);

  return { taskStats, agentStats, deliverableCount, projectCount };
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const data = await getAnalyticsData(session!.user.id);

  return (
    <>
      <Header title="Analytics" subtitle="Agency performance overview" />
      <AnalyticsClient data={data} />
    </>
  );
}
