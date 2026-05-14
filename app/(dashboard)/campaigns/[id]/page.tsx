import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import AgentOrchestrator from '@/components/campaigns/AgentOrchestrator';

interface Props {
  params: { id: string };
}

async function getCampaign(id: string, userId: string) {
  return prisma.campaign.findFirst({
    where: {
      id,
      project: { members: { some: { userId } } },
    },
    include: {
      project: { select: { id: true, name: true } },
      agentTasks: {
        include: {
          task: {
            include: {
              assignedAgent: { select: { emoji: true, name: true } },
              agentOutputs: {
                orderBy: { version: 'desc' },
                select: { id: true, status: true, version: true, createdAt: true },
              },
              _count: { select: { comments: true } },
            },
          },
        },
        orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  });
}

export default async function CampaignDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const campaign = await getCampaign(params.id, session.user.id);

  if (!campaign) notFound();

  const serialized = {
    ...campaign,
    brief: campaign.brief as Record<string, unknown>,
    launchedAt: campaign.launchedAt?.toISOString() ?? null,
    agentTasks: campaign.agentTasks.map((at) => ({
      ...at,
      task: {
        ...at.task,
        agentOutputs: at.task.agentOutputs.map((o) => ({
          ...o,
          createdAt: o.createdAt.toISOString(),
        })),
      },
    })),
  };

  return (
    <>
      <Header
        title={campaign.name}
        subtitle={campaign.project.name}
        backHref="/campaigns"
        backLabel="Campaigns"
      />
      <div className="p-6 animate-fade-in">
        <AgentOrchestrator campaign={serialized} />
      </div>
    </>
  );
}
