import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const task = await prisma.task.findFirst({
    where: { id: params.taskId, projectId: params.projectId },
    include: {
      assignedUser: { select: { id: true, name: true, image: true, email: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true, type: true } },
      comments: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'asc' },
      },
      attachments: true,
      subTasks: {
        include: { assignedUser: { select: { id: true, name: true, image: true } } },
        orderBy: { orderIndex: 'asc' },
      },
      agentOutputs: {
        include: {
          agent: { select: { type: true, name: true, emoji: true } },
        },
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, description, priority, status, dueDate, tags, assignedUserId, subtasks } = body as {
    title?: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string | null;
    tags?: string[];
    assignedUserId?: string | null;
    subtasks?: unknown[];
  };

  const task = await prisma.task.update({
    where: { id: params.taskId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: {
      ...(title ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priority ? { priority: priority as never } : {}),
      ...(status ? { status: status as never } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(subtasks !== undefined ? { subtasks } : {}),
      ...(assignedUserId !== undefined ? {
        assignedUserId,
        assignedType: assignedUserId ? 'human' : 'unassigned',
      } : {}),
    } as any,
    include: {
      assignedUser: { select: { id: true, name: true, image: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true } },
    },
  });

  if (status) {
    await logActivity({
      projectId: params.projectId,
      userId: session.user.id,
      action: status === 'done' ? 'task_completed' : 'task_updated',
      entityType: 'task',
      entityId: params.taskId,
      metadata: { updatedFields: Object.keys(body), title: task.title },
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { projectId: string; taskId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.task.delete({ where: { id: params.taskId } });
  return NextResponse.json({ deleted: true });
}
