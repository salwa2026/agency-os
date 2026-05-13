import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueueAgentCommand } from '@/lib/queue/agentQueue';
import { buildAgentCommand } from '@/lib/campaigns/commandBuilder';
import { AGENT_DEFINITIONS } from '@/lib/agents/systemPrompts';
import type { CampaignBrief } from '@/types/campaign';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // phase=1 launches only phase 1, phase=undefined launches ALL phases
  const { phase: targetPhase } = body as { phase?: number };

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      project: { members: { some: { userId: session.user.id } } },
    },
    include: {
      agentTasks: {
        include: { task: true },
        orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const brief = campaign.brief as unknown as CampaignBrief;
  const tasksToLaunch = campaign.agentTasks.filter((at) =>
    targetPhase ? at.phase === targetPhase : true,
  );

  const launched: string[] = [];

  for (const agentTask of tasksToLaunch) {
    if (agentTask.task.status !== 'backlog') continue;

    const command = buildAgentCommand(agentTask.commandTemplate ?? '', brief);

    let agentRecord = await prisma.agent.findFirst({ where: { type: agentTask.agentType } });
    if (!agentRecord) {
      const def = AGENT_DEFINITIONS[agentTask.agentType as keyof typeof AGENT_DEFINITIONS];
      agentRecord = await prisma.agent.create({
        data: {
          name: def.name,
          type: agentTask.agentType,
          emoji: def.emoji,
          description: def.description,
          status: 'available',
        },
      });
    }

    const agentCmd = await prisma.agentCommand.create({
      data: {
        taskId: agentTask.taskId,
        agentId: agentRecord.id,
        agentType: agentTask.agentType,
        command,
        status: 'queued',
        version: 1,
      },
    });

    await prisma.task.update({
      where: { id: agentTask.taskId },
      data: {
        assignedType: 'agent',
        assignedAgentId: agentRecord.id,
        status: 'in_progress',
      },
    });

    await enqueueAgentCommand({
      commandId: agentCmd.id,
      taskId: agentTask.taskId,
      agentType: agentTask.agentType,
      command,
      projectId: campaign.projectId,
      userId: session.user.id,
    });

    launched.push(agentTask.taskId);
  }

  await prisma.campaign.update({
    where: { id: params.id },
    data: {
      status: 'active',
      launchedAt: campaign.launchedAt ?? new Date(),
    },
  });

  return NextResponse.json({ launched: launched.length, taskIds: launched });
}
