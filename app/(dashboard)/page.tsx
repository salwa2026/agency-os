import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import OverviewClient from '@/components/dashboard/OverviewClient';

/* ---------------- TYPES ---------------- */

type Project = {
  createdAt: Date;
  updatedAt: Date;
  status: string;
};

type Activity = {
  createdAt: Date;
  metadata: unknown;
};

/* ---------------- DATA ---------------- */

async function getDashboardData(userId: string) {
  const [projects, recentActivity, agentStats] = await Promise.all([
    prisma.project.findMany({
      where: {
        members: { some: { userId } },
        status: { in: ['active', 'paused'] },
      },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: 'done' }, select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),

    prisma.activityLog.findMany({
      where: { project: { members: { some: { userId } } } },
      include: {
        user: { select: { name: true, image: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    }),

    prisma.agentCommand.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ]);

  const totalTasks = await prisma.task.count({
    where: { project: { members: { some: { userId } } } },
  });

  const doneTasks = await prisma.task.count({
    where: {
      project: { members: { some: { userId } } },
      status: 'done',
    },
  });

  const pendingReviews = await prisma.agentOutput.count({
    where: { status: 'pending_review' },
  });

  const deliverables = await prisma.deliverable.count({
    where: { project: { members: { some: { userId } } } },
  });

  return {
    projects: projects.map((project: any) => ({
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    })),

    recentActivity: recentActivity.map((activity: any) => ({
      ...activity,
      createdAt: activity.createdAt.toISOString(),
      metadata: activity.metadata ?? {},
    })),

    agentStats,

    stats: {
      totalTasks,
      doneTasks,
      pendingReviews,
      deliverables,
      activeProjects: projects.filter((p: any) => p.status === 'active').length,
    },
  };
}

/* ---------------- PAGE ---------------- */

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);

  // ✅ FIX IMPORTANT (évite crash TypeScript/Runtime)
  if (!session?.user?.id) {
    return null;
  }

  const data = await getDashboardData(session.user.id);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <>
      <Header
        title={`${greeting}, ${session.user.name?.split(' ')[0] ?? 'CEO'}`}
        subtitle="Here's what's happening across your agency"
      />
      <OverviewClient data={data} />
    </>
  );
}