import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = {
  url: REDIS_URL,
};

export interface AgentJobData {
  commandId: string;
  taskId: string;
  agentType: string;
  command: string;
  projectId: string;
  userId: string;
  revisionNumber?: number;
  previousOutputId?: string;
}

export const agentQueue = new Queue<AgentJobData>('agent-commands', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function enqueueAgentCommand(data: AgentJobData): Promise<string> {
  const job = await agentQueue.add('process-command', data, {
    jobId: `cmd-${data.commandId}`,
  });
  return job.id ?? data.commandId;
}
