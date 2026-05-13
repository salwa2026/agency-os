import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorize(id: string, userId: string) {
  return prisma.growthExperiment.findFirst({
    where: { id, project: { members: { some: { userId } } } },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const exp = await authorize(params.id, session.user.id);
  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    name, hypothesis, variantA, variantB, metric, targetLift,
    status, winner, resultA, resultB, startDate, endDate, notes, tags,
  } = body;

  const updated = await prisma.growthExperiment.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(hypothesis !== undefined && { hypothesis }),
      ...(variantA !== undefined && { variantA }),
      ...(variantB !== undefined && { variantB }),
      ...(metric !== undefined && { metric }),
      ...(targetLift !== undefined && { targetLift: targetLift ? parseFloat(targetLift) : null }),
      ...(status !== undefined && { status }),
      ...(winner !== undefined && { winner }),
      ...(resultA !== undefined && { resultA: resultA !== null ? parseFloat(resultA) : null }),
      ...(resultB !== undefined && { resultB: resultB !== null ? parseFloat(resultB) : null }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(notes !== undefined && { notes }),
      ...(tags !== undefined && { tags }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const exp = await authorize(params.id, session.user.id);
  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.growthExperiment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
