import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import BrandingClient from '@/components/branding/BrandingClient';

export const metadata = { title: 'Branding' };

async function getBrandingData(userId: string) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, status: { not: 'archived' } },
    select: { id: true, name: true, industry: true },
    orderBy: { name: 'asc' },
  });

  if (projects.length === 0) return { projects, profiles: [], assets: [] };

  const projectIds = projects.map((p) => p.id);

  const [profiles, assets] = await Promise.all([
    prisma.brandProfile.findMany({ where: { projectId: { in: projectIds } } }),
    prisma.brandAsset.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  return { projects, profiles, assets };
}

export default async function BrandingPage() {
  const session = await getServerSession(authOptions);
  const { projects, profiles, assets } = await getBrandingData(session!.user.id);

  return (
    <>
      <Header title="Branding" subtitle={`${profiles.length} brand profile${profiles.length !== 1 ? 's' : ''}`} />
      <BrandingClient
        projects={projects}
        initialProfiles={JSON.parse(JSON.stringify(profiles))}
        initialAssets={JSON.parse(JSON.stringify(assets))}
      />
    </>
  );
}
