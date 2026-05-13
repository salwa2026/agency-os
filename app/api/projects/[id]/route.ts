import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

async function assertAccess(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await assertAccess(params.id, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true, email: true } } } },
      kpis: { orderBy: { createdAt: 'asc' } },
      budgetItems: true,
      _count: { select: { tasks: true, deliverables: true } },
    },
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await assertAccess(params.id, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, industry, startDate, endDate, budget } = body as {
    name?: string;
    description?: string;
    industry?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  };

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(name ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(industry !== undefined ? { industry } : {}),
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
      ...(budget !== undefined ? { budget } : {}),
    },
  });

  await logActivity({
    projectId: params.id,
    userId: session.user.id,
    action: 'project_updated',
    entityType: 'project',
    entityId: params.id,
    metadata: { updatedFields: Object.keys(body) },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: params.id, userId: session.user.id } },
  });

  if (!member || member.role !== 'owner') {
    return NextResponse.json({ error: 'Only the project owner can delete it' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
