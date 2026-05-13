import { prisma } from './prisma';

export type ActivityAction =
  | 'project_created'
  | 'project_updated'
  | 'project_status_changed'
  | 'task_created'
  | 'task_updated'
  | 'task_moved'
  | 'task_assigned'
  | 'task_completed'
  | 'agent_assigned'
  | 'agent_output_ready'
  | 'output_approved'
  | 'output_revision_requested'
  | 'output_rejected'
  | 'deliverable_created'
  | 'comment_added'
  | 'member_added'
  | 'kpi_updated';

interface LogActivityParams {
  projectId: string;
  userId?: string;
  agentId?: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams) {
  return prisma.activityLog.create({
    data: {
      projectId: params.projectId,
      userId: params.userId,
      agentId: params.agentId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: (params.metadata ?? {}) as any,
    },
  });
}
