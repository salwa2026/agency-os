import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const output = await prisma.agentOutput.findUnique({
    where: { id: params.id },
    include: {
      task: { select: { title: true, projectId: true } },
    },
  });

  if (!output) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // commandId is a plain field (no Prisma relation) — fetch separately
  const sourceCommand = await prisma.agentCommand.findUnique({
    where: { id: output.commandId },
    select: { agentType: true, command: true, version: true },
  }).catch(() => null);

  const allVersions = await prisma.agentOutput.findMany({
    where: { taskId: output.taskId },
    select: { id: true, version: true, status: true, createdAt: true },
    orderBy: { version: 'asc' },
  });

  return NextResponse.json({ ...output, sourceCommand, allVersions });
}
