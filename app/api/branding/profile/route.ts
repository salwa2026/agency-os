import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function assertMember(projectId: string, userId: string) {
  const m = await prisma.projectMember.findFirst({ where: { projectId, userId } });
  return !!m;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  if (!(await assertMember(projectId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profile = await prisma.brandProfile.findUnique({ where: { projectId } });
  return NextResponse.json(profile ?? null);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { projectId, ...data } = body;
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  if (!(await assertMember(projectId, session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const profile = await prisma.brandProfile.upsert({
    where: { projectId },
    create: { projectId, ...sanitize(data) },
    update: sanitize(data),
  });

  return NextResponse.json(profile);
}

function sanitize(data: Record<string, unknown>) {
  const allowed = [
    'companyName', 'tagline', 'mission', 'vision', 'values',
    'primaryColor', 'secondaryColor', 'accentColor', 'neutralColor',
    'primaryFont', 'secondaryFont', 'toneOfVoice',
    'targetAudience', 'competitors', 'industry', 'logoUrl',
  ];
  return Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
}
