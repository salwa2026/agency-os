import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const keywords = await prisma.keyword.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(keywords);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, keyword, targetUrl, searchVolume, difficulty, targetPosition, currentPosition, tags, notes } = body;

  if (!projectId || !keyword?.trim()) {
    return NextResponse.json({ error: 'projectId and keyword are required' }, { status: 400 });
  }

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const created = await prisma.keyword.create({
    data: {
      projectId,
      keyword: keyword.trim(),
      targetUrl: targetUrl?.trim() || null,
      searchVolume: searchVolume ? parseInt(searchVolume) : null,
      difficulty: difficulty ? Math.min(100, Math.max(0, parseInt(difficulty))) : null,
      currentPosition: currentPosition ? parseInt(currentPosition) : null,
      targetPosition: targetPosition ? parseInt(targetPosition) : 10,
      tags: tags ?? [],
      notes: notes?.trim() || null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
