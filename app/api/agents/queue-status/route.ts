import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { agentQueue } from '@/lib/queue/agentQueue';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [waiting, active, completed, failed] = await Promise.all([
    agentQueue.getWaitingCount(),
    agentQueue.getActiveCount(),
    agentQueue.getCompletedCount(),
    agentQueue.getFailedCount(),
  ]);

  return NextResponse.json({ waiting, active, completed, failed });
}
