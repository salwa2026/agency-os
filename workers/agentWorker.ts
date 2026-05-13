import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { streamAgentResponse } from '../lib/agents/claudeStream';
import { AgentType } from '../lib/agents/systemPrompts';
import type { AgentJobData } from '../lib/queue/agentQueue';

const prisma = new PrismaClient();

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function processAgentCommand(job: Job<AgentJobData>) {
  const { commandId, taskId, agentType, command, projectId, userId, revisionNumber, previousOutputId } = job.data;

  await prisma.agentCommand.update({
    where: { id: commandId },
    data: { status: 'processing', startedAt: new Date() },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'in_progress' },
  });

  await job.updateProgress(10);

  let revisionContext: {
    originalCommand: string;
    previousOutput: string;
    revisionNote: string;
  } | undefined;

  if (previousOutputId && revisionNumber && revisionNumber > 1) {
    const previousOutput = await prisma.agentOutput.findUnique({
      where: { id: previousOutputId },
    });
    if (previousOutput) {
      revisionContext = {
        originalCommand: previousOutput.command,
        previousOutput: previousOutput.content,
        revisionNote: previousOutput.revisionNote ?? '',
      };
    }
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, description: true, industry: true },
  });

  const projectContext = project
    ? `Project: ${project.name}\nIndustry: ${project.industry ?? 'Not specified'}\nDescription: ${project.description ?? 'Not specified'}`
    : undefined;

  let fullOutput = '';
  let hasError = false;
  let errorMessage = '';

  await streamAgentResponse({
    agentType: agentType as AgentType,
    command,
    projectContext,
    revisionContext,
    onChunk: async (text) => {
      fullOutput += text;
      await job.updateProgress(Math.min(90, 10 + Math.floor((fullOutput.length / 3000) * 80)));
    },
    onComplete: async (completeText) => {
      fullOutput = completeText;
    },
    onError: (error) => {
      hasError = true;
      errorMessage = error.message;
    },
  });

  if (hasError) {
    await prisma.agentCommand.update({
      where: { id: commandId },
      data: { status: 'failed', failedAt: new Date(), errorMessage },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'backlog' },
    });

    throw new Error(`Agent processing failed: ${errorMessage}`);
  }

  const agentRecord = await prisma.agent.findFirst({
    where: { type: agentType },
  });

  const output = await prisma.agentOutput.create({
    data: {
      commandId,
      taskId,
      agentId: agentRecord?.id,
      content: fullOutput,
      command,
      version: revisionNumber ?? 1,
      status: 'pending_review',
    },
  });

  await prisma.agentCommand.update({
    where: { id: commandId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      outputId: output.id,
    },
  });

  await prisma.task.update({
    where: { id: taskId },
    data: { status: 'review' },
  });

  await prisma.activityLog.create({
    data: {
      projectId,
      agentId: agentRecord?.id,
      action: 'agent_output_ready',
      entityType: 'agent_output',
      entityId: output.id,
      metadata: {
        agentType,
        taskId,
        version: revisionNumber ?? 1,
        outputLength: fullOutput.length,
      },
    },
  });

  await job.updateProgress(100);

  return { outputId: output.id, taskId, commandId };
}

const worker = new Worker<AgentJobData>(
  'agent-commands',
  processAgentCommand,
  {
    connection: { url: REDIS_URL },
    concurrency: 3,
  },
);

worker.on('completed', (job, result) => {
  console.log(`[AgentWorker] Job ${job.id} completed`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[AgentWorker] Job ${job?.id} failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('[AgentWorker] Worker error:', err);
});

process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await worker.close();
  await prisma.$disconnect();
});

export default worker;
