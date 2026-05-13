import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueueAgentCommand } from '@/lib/queue/agentQueue';
import { logActivity } from '@/lib/activity';

const MAX_REVISION_VERSIONS = 5;

function buildRevisionCommand(
  originalCommand: string,
  previousOutput: string,
  revisionNote: string,
): string {
  return `ORIGINAL TASK:
${originalCommand}

YOUR PREVIOUS OUTPUT:
${previousOutput}

REVISION REQUESTED BY CEO:
${revisionNote}

Please revise your output based on the feedback. Preserve everything that was not mentioned in the revision request. Be specific and thorough.`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { action, revisionNote } = body as {
    action: 'approve' | 'revise' | 'reject';
    revisionNote?: string;
  };

  const output = await prisma.agentOutput.findUnique({
    where: { id: params.id },
    include: {
      task: { include: { project: true } },
    },
  });

  if (!output) {
    return NextResponse.json({ error: 'Output not found' }, { status: 404 });
  }

  // commandId is a plain field (no Prisma relation) — fetch separately
  const sourceCommand = await prisma.agentCommand.findUnique({
    where: { id: output.commandId },
  });
  if (!sourceCommand) {
    return NextResponse.json({ error: 'Source command not found' }, { status: 404 });
  }

  if (output.status !== 'pending_review') {
    return NextResponse.json({ error: 'Output is not pending review' }, { status: 400 });
  }

  if (action === 'approve') {
    const result = await prisma.$transaction(async (tx) => {
      await tx.agentOutput.update({
        where: { id: params.id },
        data: { status: 'approved', reviewedAt: new Date(), reviewedById: session.user.id },
      });

      await tx.task.update({
        where: { id: output.taskId },
        data: { status: 'done' },
      });

      const deliverable = await tx.deliverable.create({
        data: {
          projectId: output.task.projectId,
          taskId: output.taskId,
          agentOutputId: params.id,
          title: output.task.title,
          content: output.content,
          type: sourceCommand.agentType,
          status: 'approved',
          approvedById: session.user.id,
          approvedAt: new Date(),
        },
      });

      return deliverable;
    });

    await logActivity({
      projectId: output.task.projectId,
      userId: session.user.id,
      action: 'output_approved',
      entityType: 'agent_output',
      entityId: params.id,
      metadata: { deliverableId: result.id, taskId: output.taskId },
    });

    return NextResponse.json({ status: 'approved', deliverableId: result.id });
  }

  if (action === 'revise') {
    if (!revisionNote?.trim()) {
      return NextResponse.json({ error: 'Revision note is required' }, { status: 400 });
    }

    const currentVersion = output.version ?? 1;
    if (currentVersion >= MAX_REVISION_VERSIONS) {
      return NextResponse.json(
        { error: `Maximum revision limit (${MAX_REVISION_VERSIONS}) reached` },
        { status: 400 },
      );
    }

    const newVersion = currentVersion + 1;

    const newCommand = await prisma.$transaction(async (tx) => {
      await tx.agentOutput.update({
        where: { id: params.id },
        data: {
          status: 'revision_requested',
          revisionNote,
          reviewedAt: new Date(),
          reviewedById: session.user.id,
        },
      });

      await tx.task.update({
        where: { id: output.taskId },
        data: { status: 'in_progress' },
      });

      const cmd = await tx.agentCommand.create({
        data: {
          taskId: output.taskId,
          agentId: sourceCommand.agentId,
          agentType: sourceCommand.agentType,
          command: buildRevisionCommand(
            sourceCommand.command,
            output.content,
            revisionNote,
          ),
          status: 'queued',
          version: newVersion,
          previousOutputId: params.id,
          revisionNote,
        },
      });

      return cmd;
    });

    await enqueueAgentCommand({
      commandId: newCommand.id,
      taskId: output.taskId,
      agentType: sourceCommand.agentType,
      command: newCommand.command,
      projectId: output.task.projectId,
      userId: session.user.id,
      revisionNumber: newVersion,
      previousOutputId: params.id,
    });

    await logActivity({
      projectId: output.task.projectId,
      userId: session.user.id,
      action: 'output_revision_requested',
      entityType: 'agent_output',
      entityId: params.id,
      metadata: { revisionNote, newVersion, newCommandId: newCommand.id },
    });

    return NextResponse.json({
      status: 'revision_queued',
      newCommandId: newCommand.id,
      version: newVersion,
      revisionsRemaining: MAX_REVISION_VERSIONS - newVersion,
    });
  }

  if (action === 'reject') {
    await prisma.$transaction(async (tx) => {
      await tx.agentOutput.update({
        where: { id: params.id },
        data: { status: 'rejected', reviewedAt: new Date(), reviewedById: session.user.id },
      });

      await tx.task.update({
        where: { id: output.taskId },
        data: {
          status: 'backlog',
          assignedType: 'unassigned',
          assignedAgentId: null,
        },
      });
    });

    await logActivity({
      projectId: output.task.projectId,
      userId: session.user.id,
      action: 'output_rejected',
      entityType: 'agent_output',
      entityId: params.id,
      metadata: { taskId: output.taskId },
    });

    return NextResponse.json({ status: 'rejected' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
