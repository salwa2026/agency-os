import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import TasksClient from '@/components/tasks/TasksClient';

export const metadata = { title: 'Tasks' };

async function getAllTasks(userId: string) {
  return prisma.task.findMany({
    where: { project: { members: { some: { userId } } } },
    include: {
      project: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true, image: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true } },
      agentOutputs: {
        where: { status: 'pending_review' },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  });
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const tasks = await getAllTasks(session!.user.id);
  const pendingReview = tasks.filter((t) => t.agentOutputs.length > 0).length;

  return (
    <>
      <Header
        title="Tasks"
        subtitle={`${tasks.length} total${pendingReview > 0 ? ` · ${pendingReview} pending review` : ''}`}
      />
      <TasksClient tasks={JSON.parse(JSON.stringify(tasks))} />
    </>
  );
}
