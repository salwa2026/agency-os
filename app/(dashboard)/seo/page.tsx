import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import SeoClient from '@/components/seo/SeoClient';

export const metadata = { title: 'SEO' };

async function getSeoData(userId: string) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, status: { not: 'archived' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  if (projects.length === 0) return { projects, keywords: [], briefs: [] };

  const projectIds = projects.map((p) => p.id);

  const [keywords, briefs] = await Promise.all([
    prisma.keyword.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contentBrief.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        keyword: { select: { keyword: true } },
        createdBy: { select: { name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { projects, keywords, briefs };
}

export default async function SeoPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const { projects, keywords, briefs } = await getSeoData(session.user.id);

  const totalKeywords = keywords.length;
  const trackedKeywords = keywords.filter((k) => k.tracked && k.currentPosition != null);
  const avgPosition = trackedKeywords.length
    ? Math.round(trackedKeywords.reduce((s, k) => s + k.currentPosition!, 0) / trackedKeywords.length)
    : null;
  const publishedBriefs = briefs.filter((b) => b.status === 'published').length;
  const inProgressBriefs = briefs.filter((b) =>
    ['ready', 'in_progress', 'in_review'].includes(b.status)
  ).length;

  return (
    <>
      <Header
        title="SEO"
        subtitle={`${totalKeywords} keywords · ${briefs.length} briefs`}
      />
      <SeoClient
        projects={projects}
        initialKeywords={JSON.parse(JSON.stringify(keywords))}
        initialBriefs={JSON.parse(JSON.stringify(briefs))}
        stats={{ totalKeywords, avgPosition, publishedBriefs, inProgressBriefs }}
      />
    </>
  );
}
