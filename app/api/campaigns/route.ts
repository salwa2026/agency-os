import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';
import { getTemplate } from '@/lib/campaigns/templates';
import { buildAgentCommand } from '@/lib/campaigns/commandBuilder';
import { enqueueAgentCommand } from '@/lib/queue/agentQueue';
import type { CampaignBrief } from '@/types/campaign';
import { AGENT_DEFINITIONS } from '@/lib/agents/systemPrompts';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const campaigns = await prisma.campaign.findMany({
    where: {
      project: { members: { some: { userId: session.user.id } } },
      ...(projectId ? { projectId } : {}),
    },
    include: {
      _count: { select: { agentTasks: true } },
      agentTasks: {
        include: {
          task: {
            select: {
              id: true,
              status: true,
              agentOutputs: {
                where: { status: 'pending_review' },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
        orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, name, type, brief, autoLaunch = false } = body as {
    projectId: string;
    name: string;
    type: string;
    brief: CampaignBrief;
    autoLaunch?: boolean;
  };

  if (!projectId || !name || !type || !brief) {
    return NextResponse.json({ error: 'projectId, name, type, and brief are required' }, { status: 400 });
  }

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const template = getTemplate(type);
  if (!template) return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 });

  const allAgentTasks = template.phases.flatMap((phase) =>
    phase.agents.map((agent, idx) => ({ phase, agent, idx })),
  );
  const totalTasks = allAgentTasks.length;

  const campaign = await prisma.$transaction(async (tx) => {
    const camp = await tx.campaign.create({
      data: {
        projectId,
        name,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brief: brief as any,
        status: autoLaunch ? 'active' : 'draft',
        totalTasks,
        createdById: session.user.id,
        launchedAt: autoLaunch ? new Date() : undefined,
      },
    });

    for (const { phase, agent, idx } of allAgentTasks) {
      const command = buildAgentCommand(agent.commandTemplate, brief);

      const task = await tx.task.create({
        data: {
          projectId,
          title: agent.taskTitle,
          description: `Campaign: ${name} | Phase ${phase.phase}: ${phase.phaseName}`,
          status: autoLaunch && !agent.dependsOnPhase ? 'in_progress' : 'backlog',
          priority: 'high',
          tags: ['campaign', type, `phase-${phase.phase}`],
          orderIndex: phase.phase * 100 + idx,
        },
      });

      await tx.campaignAgentTask.create({
        data: {
          campaignId: camp.id,
          taskId: task.id,
          agentType: agent.agentType,
          phase: phase.phase,
          phaseName: phase.phaseName,
          commandTemplate: agent.commandTemplate,
          orderIndex: idx,
        },
      });

      if (autoLaunch && !agent.dependsOnPhase) {
        let agentRecord = await tx.agent.findFirst({ where: { type: agent.agentType } });
        if (!agentRecord) {
          const def = AGENT_DEFINITIONS[agent.agentType as keyof typeof AGENT_DEFINITIONS];
          agentRecord = await tx.agent.create({
            data: {
              name: def.name,
              type: agent.agentType,
              emoji: def.emoji,
              description: def.description,
              status: 'available',
            },
          });
        }

        const agentCmd = await tx.agentCommand.create({
          data: {
            taskId: task.id,
            agentId: agentRecord.id,
            agentType: agent.agentType,
            command,
            status: 'queued',
            version: 1,
          },
        });

        await tx.task.update({
          where: { id: task.id },
          data: {
            assignedType: 'agent',
            assignedAgentId: agentRecord.id,
            status: 'in_progress',
          },
        });

        // We enqueue outside the transaction
        void enqueueAgentCommand({
          commandId: agentCmd.id,
          taskId: task.id,
          agentType: agent.agentType,
          command,
          projectId,
          userId: session.user.id,
        });
      }
    }

    return camp;
  });

  await logActivity({
    projectId,
    userId: session.user.id,
    action: 'project_created',
    entityType: 'campaign',
    entityId: campaign.id,
    metadata: { name, type, totalTasks, autoLaunch },
  });

  return NextResponse.json(campaign, { status: 201 });
}
