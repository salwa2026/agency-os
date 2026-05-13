import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

const TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: ['archived'],
  archived: [],
  cancelled: [],
};

function isValidTransition(current: string, next: string): boolean {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { status: newStatus } = body as { status: string };

  const project = await prisma.project.findFirst({
    where: { id: params.id, members: { some: { userId: session.user.id } } },
  });

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!isValidTransition(project.status, newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${project.status}" to "${newStatus}"` },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: { status: newStatus as never },
  });

  await logActivity({
    projectId: params.id,
    userId: session.user.id,
    action: 'project_status_changed',
    entityType: 'project',
    entityId: params.id,
    metadata: { from: project.status, to: newStatus },
  });

  return NextResponse.json(updated);
}
