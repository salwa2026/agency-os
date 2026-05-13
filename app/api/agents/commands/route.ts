import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueueAgentCommand } from '@/lib/queue/agentQueue';
import { AGENT_DEFINITIONS } from '@/lib/agents/systemPrompts';
import { logActivity } from '@/lib/activity';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { taskId, agentType, command } = body as {
    taskId: string;
    agentType: string;
    command: string;
  };

  if (!taskId || !agentType || !command) {
    return NextResponse.json({ error: 'taskId, agentType, and command are required' }, { status: 400 });
  }

  if (!Object.keys(AGENT_DEFINITIONS).includes(agentType)) {
    return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  let agentRecord = await prisma.agent.findFirst({ where: { type: agentType } });
  if (!agentRecord) {
    const def = AGENT_DEFINITIONS[agentType as keyof typeof AGENT_DEFINITIONS];
    agentRecord = await prisma.agent.create({
      data: {
        name: def.name,
        type: agentType,
        emoji: def.emoji,
        description: def.description,
        status: 'available',
      },
    });
  }

  const agentCommand = await prisma.$transaction(async (tx) => {
    const cmd = await tx.agentCommand.create({
      data: {
        taskId,
        agentId: agentRecord!.id,
        command,
        agentType,
        status: 'queued',
        version: 1,
      },
    });

    await tx.task.update({
      where: { id: taskId },
      data: {
        status: 'in_progress',
        assignedType: 'agent',
        assignedAgentId: agentRecord!.id,
      },
    });

    return cmd;
  });

  await enqueueAgentCommand({
    commandId: agentCommand.id,
    taskId,
    agentType,
    command,
    projectId: task.projectId,
    userId: session.user.id,
  });

  await logActivity({
    projectId: task.projectId,
    userId: session.user.id,
    action: 'agent_assigned',
    entityType: 'task',
    entityId: taskId,
    metadata: { agentType, commandId: agentCommand.id },
  });

  return NextResponse.json({ commandId: agentCommand.id, status: 'queued' }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const taskId = searchParams.get('taskId');
  const status = searchParams.get('status');

  const commands = await prisma.agentCommand.findMany({
    where: {
      ...(taskId ? { taskId } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(status ? { status: status as any } : {}),
      ...(projectId ? { task: { projectId } } : {}),
    },
    include: {
      task: { select: { title: true, projectId: true } },
      output: {
        select: { id: true, status: true, version: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(commands);
}
