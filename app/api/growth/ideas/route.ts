import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, focus } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId: session.user.id } } },
    include: {
      kpis: { take: 5 },
      _count: { select: { tasks: true, deliverables: true } },
    },
  });
  if (!project) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const prompt = `You are a senior growth hacker. Generate 10 high-impact, specific growth experiment ideas for the following project.

**Project:** ${project.name}
**Industry:** ${project.industry ?? 'Not specified'}
**Description:** ${project.description ?? 'Not specified'}
**Focus Area:** ${focus || 'General growth'}
${project.kpis.length ? `**Current KPIs:** ${project.kpis.map((k) => `${k.name}: ${k.value}${k.unit ?? ''} (target: ${k.target})`).join(', ')}` : ''}

Return ONLY valid JSON (no markdown):
{
  "ideas": [
    {
      "id": "idea_1",
      "title": "Concise experiment title",
      "category": "acquisition | activation | retention | referral | revenue",
      "hypothesis": "If we [action], then [metric] will [change] by [amount] because [reason]",
      "variantA": "Control: current state description",
      "variantB": "Treatment: what we change",
      "metric": "Primary metric to measure",
      "targetLift": 15,
      "effort": "low | medium | high",
      "impact": "low | medium | high",
      "timeToResults": "1 week | 2 weeks | 1 month",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Make ideas highly specific, actionable, and relevant to the project. Cover different AARRR funnel stages.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let content = '';
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 4000,
          thinking: { type: 'adaptive' },
          system: 'You are a growth hacking expert. Return only valid JSON.',
          messages: [{ role: 'user', content: prompt }],
        } as any);

        for await (const event of response) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            content += event.delta.text;
            controller.enqueue(encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }

        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          controller.enqueue(encoder.encode(`event: complete\ndata: ${JSON.stringify(parsed)}\n\n`));
        } else {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Could not parse ideas' })}\n\n`));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed';
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
