import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import ProjectDetailClient from '@/components/projects/ProjectDetailClient';
import Button from '@/components/ui/Button';

async function getProject(id: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id, members: { some: { userId } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true, email: true } } } },
      kpis: { orderBy: { createdAt: 'asc' } },
      _count: { select: { tasks: true, deliverables: true } },
    },
  });
  if (!project) return null;

  const tasks = await prisma.task.findMany({
    where: { projectId: id },
    include: {
      assignedUser: { select: { id: true, name: true, image: true } },
      assignedAgent: { select: { id: true, name: true, emoji: true, type: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [{ status: 'asc' }, { orderIndex: 'asc' }],
  });

  return { project, tasks };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const result = await getProject(params.id, session!.user.id);
  return { title: result?.project.name ?? 'Project' };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const result = await getProject(params.id, session!.user.id);

  if (!result) notFound();

  const { project, tasks } = result;

  return (
    <>
      <Header
        title={project.name}
        subtitle={`${project._count.tasks} tasks · ${project._count.deliverables} deliverables`}
      />
      <ProjectDetailClient
        project={JSON.parse(JSON.stringify(project))}
        initialTasks={JSON.parse(JSON.stringify(tasks))}
        currentUserId={session!.user.id}
      />
    </>
  );
}
