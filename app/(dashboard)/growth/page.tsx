import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import GrowthClient from '@/components/growth/GrowthClient';

export const metadata = { title: 'Growth' };

async function getData(userId: string) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, status: { not: 'archived' } },
    select: { id: true, name: true, industry: true, description: true },
    orderBy: { name: 'asc' },
  });

  if (!projects.length) return { projects, experiments: [] };

  const experiments = await prisma.growthExperiment.findMany({
    where: { projectId: { in: projects.map((p) => p.id) } },
    orderBy: { createdAt: 'desc' },
  });

  return { projects, experiments };
}

export default async function GrowthPage() {
  const session = await getServerSession(authOptions);
  const { projects, experiments } = await getData(session!.user.id);

  const running = experiments.filter((e) => e.status === 'running').length;
  const complete = experiments.filter((e) => e.status === 'complete').length;
  const wins = experiments.filter((e) => e.status === 'complete' && e.winner === 'b').length;

  return (
    <>
      <Header
        title="Growth"
        subtitle={`${experiments.length} experiment${experiments.length !== 1 ? 's' : ''}`}
      />
      <GrowthClient
        projects={projects}
        initialExperiments={JSON.parse(JSON.stringify(experiments))}
        stats={{ total: experiments.length, running, complete, wins }}
      />
    </>
  );
}
