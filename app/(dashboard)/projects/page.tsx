import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import ProjectsClient from '@/components/projects/ProjectsClient';

export const metadata = { title: 'Projects' };

async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      _count: { select: { tasks: true, members: true, deliverables: true } },
      tasks: { where: { status: 'done' }, select: { id: true } },
      members: {
        take: 4,
        include: { user: { select: { name: true, image: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const projects = await getProjects(session!.user.id);

  return (
    <>
      <Header title="Projects" subtitle={`${projects.length} total`} />
      <ProjectsClient projects={JSON.parse(JSON.stringify(projects))} />
    </>
  );
}
