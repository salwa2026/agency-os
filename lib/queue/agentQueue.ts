import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const connection = { url: REDIS_URL };

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

// Lazy-initialized so the Queue is only created at runtime, not during Next.js build
let _queue: Queue<AgentJobData> | null = null;

function getQueue(): Queue<AgentJobData> {
  if (!_queue) {
    _queue = new Queue<AgentJobData>('agent-commands', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

export async function enqueueAgentCommand(data: AgentJobData): Promise<string> {
  const job = await getQueue().add('process-command', data, {
    jobId: `cmd-${data.commandId}`,
  });
  return job.id ?? data.commandId;
}
