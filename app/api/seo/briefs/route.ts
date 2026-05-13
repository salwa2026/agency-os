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

  const briefs = await prisma.contentBrief.findMany({
    where: { projectId },
    include: {
      keyword: { select: { keyword: true } },
      createdBy: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(briefs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    projectId, keywordId, targetKeyword, secondaryKeywords,
    title, contentType, wordCountTarget, priority, dueDate, notes,
  } = body;

  if (!projectId || !targetKeyword?.trim() || !title?.trim()) {
    return NextResponse.json({ error: 'projectId, targetKeyword and title are required' }, { status: 400 });
  }

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const brief = await prisma.contentBrief.create({
    data: {
      projectId,
      createdById: session.user.id,
      keywordId: keywordId || null,
      targetKeyword: targetKeyword.trim(),
      secondaryKeywords: secondaryKeywords ?? [],
      title: title.trim(),
      contentType: contentType ?? 'blog_post',
      wordCountTarget: wordCountTarget ? parseInt(wordCountTarget) : 1500,
      priority: priority ?? 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes?.trim() || null,
    },
    include: {
      keyword: { select: { keyword: true } },
      createdBy: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json(brief, { status: 201 });
}
