import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.projectId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const tasks = await prisma.task.findMany({
    where: { projectId: params.projectId },
    include: {
      assignedUser: { select: { id: true, name: true, image: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true, type: true } },
      _count: { select: { comments: true, attachments: true, subTasks: true } },
      agentOutputs: {
        where: { status: 'pending_review' },
        select: { id: true, version: true },
        take: 1,
        orderBy: { version: 'desc' },
      },
    },
    orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'asc' }],
  });

  const grouped = tasks.reduce<Record<string, typeof tasks>>((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {});

  return NextResponse.json({ tasks, grouped });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.projectId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, description, priority = 'medium', status = 'backlog', dueDate, tags, parentTaskId } = body as {
    title: string;
    description?: string;
    priority?: string;
    status?: string;
    dueDate?: string;
    tags?: string[];
    parentTaskId?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
  }

  const maxOrder = await prisma.task.aggregate({
    where: { projectId: params.projectId, status: status as never },
    _max: { orderIndex: true },
  });

  const task = await prisma.task.create({
    data: {
      projectId: params.projectId,
      title: title.trim(),
      description,
      priority: priority as never,
      status: status as never,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags ?? [],
      parentTaskId,
      orderIndex: (maxOrder._max.orderIndex ?? -1) + 1,
    },
    include: {
      assignedUser: { select: { id: true, name: true, image: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true } },
    },
  });

  await logActivity({
    projectId: params.projectId,
    userId: session.user.id,
    action: 'task_created',
    entityType: 'task',
    entityId: task.id,
    metadata: { title: task.title, priority, status },
  });

  return NextResponse.json(task, { status: 201 });
}
