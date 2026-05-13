import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function recalculateProjectProgress(projectId: string) {
  const [total, done] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: 'done' } }),
  ]);
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  await prisma.project.update({ where: { id: projectId }, data: { progress } });
  return progress;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { toStatus, toIndex } = body as { toStatus: string; toIndex: number };

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, projectId: params.projectId },
  });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const fromStatus = task.status;

  await prisma.$transaction(async (tx) => {
    if (fromStatus === toStatus) {
      // Reordering within same column
      const fromIndex = task.orderIndex;
      if (fromIndex < toIndex) {
        await tx.task.updateMany({
          where: {
            projectId: params.projectId,
            status: toStatus as never,
            orderIndex: { gt: fromIndex, lte: toIndex },
            id: { not: params.taskId },
          },
          data: { orderIndex: { decrement: 1 } },
        });
      } else {
        await tx.task.updateMany({
          where: {
            projectId: params.projectId,
            status: toStatus as never,
            orderIndex: { gte: toIndex, lt: fromIndex },
            id: { not: params.taskId },
          },
          data: { orderIndex: { increment: 1 } },
        });
      }
    } else {
      // Moving to a different column — shift destination column up
      await tx.task.updateMany({
        where: {
          projectId: params.projectId,
          status: toStatus as never,
          orderIndex: { gte: toIndex },
        },
        data: { orderIndex: { increment: 1 } },
      });
    }

    await tx.task.update({
      where: { id: params.taskId },
      data: { status: toStatus as never, orderIndex: toIndex },
    });
  });

  const progress = await recalculateProjectProgress(params.projectId);

  if (fromStatus !== toStatus) {
    await logActivity({
      projectId: params.projectId,
      userId: session.user.id,
      action: 'task_moved',
      entityType: 'task',
      entityId: params.taskId,
      metadata: { from: fromStatus, to: toStatus, title: task.title },
    });
  }

  return NextResponse.json({ moved: true, progress });
}
