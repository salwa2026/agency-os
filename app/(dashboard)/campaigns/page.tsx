import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import CampaignsClient from '@/components/campaigns/CampaignsClient';

export const metadata = { title: 'Campaigns' };

async function getCampaigns(userId: string) {
  return prisma.campaign.findMany({
    where: { project: { members: { some: { userId } } } },
    include: {
      project: { select: { id: true, name: true } },
      _count: { select: { agentTasks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function CampaignsPage() {
  const session = await getServerSession(authOptions);
  const campaigns = await getCampaigns(session!.user.id);

  return (
    <>
      <Header title="Campaigns" subtitle={`${campaigns.length} total`} />
      <CampaignsClient campaigns={JSON.parse(JSON.stringify(campaigns))} />
    </>
  );
}
