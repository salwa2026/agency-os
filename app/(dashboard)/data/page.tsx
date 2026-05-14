import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import DataClient from '@/components/data/DataClient';

export const metadata = { title: 'Data & Excel' };

async function getDataFiles(userId: string) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, status: { not: 'archived' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  if (projects.length === 0) return { projects, files: [] };

  const files = await prisma.dataFile.findMany({
    where: { projectId: { in: projects.map((p) => p.id) } },
    select: {
      id: true, name: true, originalName: true, mimeType: true,
      size: true, rowCount: true, columnCount: true, headers: true,
      preview: true, projectId: true, createdAt: true,
      uploadedBy: { select: { name: true } },
      _count: { select: { analyses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { projects, files };
}

export default async function DataPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const { projects, files } = await getDataFiles(session.user.id);

  return (
    <>
      <Header
        title="Data & Excel"
        subtitle={`${files.length} file${files.length !== 1 ? 's' : ''} uploaded`}
      />
      <DataClient
        projects={projects}
        initialFiles={JSON.parse(JSON.stringify(files))}
      />
    </>
  );
}
