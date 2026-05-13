import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function authorizeBrief(id: string, userId: string) {
  const brief = await prisma.contentBrief.findUnique({
    where: { id },
    include: {
      project: { include: { members: { where: { userId } } } },
      keyword: { select: { keyword: true } },
      createdBy: { select: { name: true, image: true } },
    },
  });
  if (!brief) return null;
  if (brief.project.members.length === 0) return null;
  return brief;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brief = await authorizeBrief(params.id, session.user.id);
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(brief);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brief = await authorizeBrief(params.id, session.user.id);
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    title, targetKeyword, secondaryKeywords, metaTitle, metaDescription,
    outline, wordCountTarget, contentType, status, priority,
    dueDate, publishedUrl, notes, aiGenerated,
  } = body;

  const updated = await prisma.contentBrief.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(targetKeyword !== undefined && { targetKeyword }),
      ...(secondaryKeywords !== undefined && { secondaryKeywords }),
      ...(metaTitle !== undefined && { metaTitle }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(outline !== undefined && { outline }),
      ...(wordCountTarget !== undefined && { wordCountTarget: parseInt(wordCountTarget) }),
      ...(contentType !== undefined && { contentType }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(publishedUrl !== undefined && { publishedUrl }),
      ...(notes !== undefined && { notes }),
      ...(aiGenerated !== undefined && { aiGenerated }),
    },
    include: {
      keyword: { select: { keyword: true } },
      createdBy: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brief = await authorizeBrief(params.id, session.user.id);
  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.contentBrief.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
