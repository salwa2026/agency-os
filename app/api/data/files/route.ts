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

  const files = await prisma.dataFile.findMany({
    where: { projectId },
    select: {
      id: true, name: true, originalName: true, mimeType: true,
      size: true, rowCount: true, columnCount: true, headers: true,
      preview: true, createdAt: true,
      uploadedBy: { select: { name: true } },
      _count: { select: { analyses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(files);
}
