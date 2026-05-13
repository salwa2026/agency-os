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

  const assets = await prisma.brandAsset.findMany({
    where: { projectId },
    orderBy: [{ category: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(assets);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, name, description, category, url, mimeType, tags } = body;

  if (!projectId || !name?.trim()) {
    return NextResponse.json({ error: 'projectId and name are required' }, { status: 400 });
  }

  const member = await prisma.projectMember.findFirst({ where: { projectId, userId: session.user.id } });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const asset = await prisma.brandAsset.create({
    data: {
      projectId,
      createdById: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      category: category ?? 'other',
      url: url?.trim() || null,
      mimeType: mimeType || null,
      tags: tags ?? [],
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
