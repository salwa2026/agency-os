import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId: session.user.id } },
      ...(status ? { status: status as never } : {}),
    },
    include: {
      _count: { select: { tasks: true, members: true, deliverables: true } },
      members: {
        take: 4,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, industry, status = 'draft', startDate, endDate, budget } = body as {
    name: string;
    description?: string;
    industry?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        name: name.trim(),
        description,
        industry,
        status: status as never,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget,
      },
    });

    await tx.projectMember.create({
      data: { projectId: p.id, userId: session.user.id, role: 'owner' },
    });

    return p;
  });

  await logActivity({
    projectId: project.id,
    userId: session.user.id,
    action: 'project_created',
    entityType: 'project',
    entityId: project.id,
    metadata: { name: project.name, status: project.status },
  });

  return NextResponse.json(project, { status: 201 });
}
