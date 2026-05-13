import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorizeKeyword(id: string, userId: string) {
  const keyword = await prisma.keyword.findUnique({
    where: { id },
    include: { project: { include: { members: { where: { userId } } } } },
  });
  if (!keyword) return null;
  if (keyword.project.members.length === 0) return null;
  return keyword;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keyword = await authorizeKeyword(params.id, session.user.id);
  if (!keyword) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { targetUrl, searchVolume, difficulty, currentPosition, targetPosition, tags, notes, tracked } = body;

  // Store old position for tracking history
  if (currentPosition !== undefined && currentPosition !== keyword.currentPosition) {
    await prisma.keywordPosition.create({
      data: { keywordId: params.id, position: parseInt(currentPosition) },
    });
  }

  const updated = await prisma.keyword.update({
    where: { id: params.id },
    data: {
      ...(targetUrl !== undefined && { targetUrl: targetUrl?.trim() || null }),
      ...(searchVolume !== undefined && { searchVolume: searchVolume ? parseInt(searchVolume) : null }),
      ...(difficulty !== undefined && { difficulty: difficulty ? Math.min(100, Math.max(0, parseInt(difficulty))) : null }),
      ...(currentPosition !== undefined && {
        previousPosition: keyword.currentPosition,
        currentPosition: currentPosition ? parseInt(currentPosition) : null,
      }),
      ...(targetPosition !== undefined && { targetPosition: parseInt(targetPosition) }),
      ...(tags !== undefined && { tags }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(tracked !== undefined && { tracked }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keyword = await authorizeKeyword(params.id, session.user.id);
  if (!keyword) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.keyword.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
