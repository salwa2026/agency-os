import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const asset = await prisma.brandAsset.findFirst({
    where: { id: params.id, project: { members: { some: { userId: session.user.id } } } },
  });
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.brandAsset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
