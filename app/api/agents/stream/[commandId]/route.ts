import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { streamAgentResponseToSSE } from '@/lib/agents/claudeStream';
import type { AgentType } from '@/lib/agents/systemPrompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { commandId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const command = await prisma.agentCommand.findUnique({
    where: { id: params.commandId },
    include: {
      task: { select: { projectId: true } },
      previousOutput: true,
    },
  });

  if (!command) {
    return new Response('Command not found', { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let revisionContext: {
        originalCommand: string;
        previousOutput: string;
        revisionNote: string;
      } | undefined;

      if (command.previousOutput) {
        revisionContext = {
          originalCommand: command.previousOutput.command,
          previousOutput: command.previousOutput.content,
          revisionNote: command.revisionNote ?? '',
        };
      }

      const project = await prisma.project.findUnique({
        where: { id: command.task.projectId },
        select: { name: true, description: true, industry: true },
      });

      const projectContext = project
        ? `Project: ${project.name}\nIndustry: ${project.industry ?? 'Not specified'}\nDescription: ${project.description ?? 'Not specified'}`
        : undefined;

      await streamAgentResponseToSSE(
        {
          agentType: command.agentType as AgentType,
          command: command.command,
          projectContext,
          revisionContext,
          onChunk: () => {},
          onComplete: () => {},
          onError: () => {},
        },
        controller,
      );
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
