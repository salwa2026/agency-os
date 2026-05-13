import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorizeFile(id: string, userId: string) {
  return prisma.dataFile.findFirst({
    where: {
      id,
      project: { members: { some: { userId } } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = await prisma.dataFile.findFirst({
    where: { id: params.id, project: { members: { some: { userId: session.user.id } } } },
    include: {
      uploadedBy: { select: { name: true } },
      analyses: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(file);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = await authorizeFile(params.id, session.user.id);
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.dataFile.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
