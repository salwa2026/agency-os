import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      project: { members: { some: { userId: session.user.id } } },
    },
    include: {
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true, image: true } },
      agentTasks: {
        include: {
          task: {
            include: {
              assignedAgent: { select: { id: true, name: true, emoji: true, type: true } },
              agentOutputs: {
                orderBy: { version: 'desc' },
                take: 1,
                select: { id: true, status: true, version: true, createdAt: true },
              },
              _count: { select: { comments: true } },
            },
          },
        },
        orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  });

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(campaign);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, status } = body as { name?: string; status?: string };

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      ...(name ? { name } : {}),
      ...(status ? { status: status as never } : {}),
    },
  });

  return NextResponse.json(campaign);
}
