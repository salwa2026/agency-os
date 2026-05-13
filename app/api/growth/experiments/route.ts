import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const member = await prisma.projectMember.findFirst({ where: { projectId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const experiments = await prisma.growthExperiment.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(experiments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, name, hypothesis, variantA, variantB, metric, targetLift, tags, notes } = body;

  if (!projectId || !name?.trim() || !hypothesis?.trim()) {
    return NextResponse.json({ error: 'projectId, name, and hypothesis are required' }, { status: 400 });
  }

  const member = await prisma.projectMember.findFirst({ where: { projectId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const experiment = await prisma.growthExperiment.create({
    data: {
      projectId,
      createdById: session.user.id,
      name: name.trim(),
      hypothesis: hypothesis.trim(),
      variantA: variantA?.trim() || null,
      variantB: variantB?.trim() || null,
      metric: metric?.trim() || null,
      targetLift: targetLift ? parseFloat(targetLift) : null,
      tags: tags ?? [],
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(experiment, { status: 201 });
}
