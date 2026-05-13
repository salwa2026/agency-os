import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const brief = await prisma.contentBrief.findUnique({
    where: { id: params.id },
    include: {
      project: {
        select: {
          name: true,
          industry: true,
          members: { where: { userId: session.user.id } },
        },
      },
    },
  });

  if (!brief || brief.project.members.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const prompt = buildBriefPrompt(brief);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          thinking: { type: 'adaptive' },
          system: `You are a senior SEO strategist and content architect. You create precise, actionable content briefs that drive organic traffic and conversions. Always respond in valid JSON matching the exact schema requested.`,
          messages: [{ role: 'user', content: prompt }],
        } as any);

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullContent += event.delta.text;
            controller.enqueue(
              encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }

        // Extract JSON from response and save to brief
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            await prisma.contentBrief.update({
              where: { id: params.id },
              data: {
                metaTitle: parsed.metaTitle ?? null,
                metaDescription: parsed.metaDescription ?? null,
                outline: parsed.outline ?? null,
                aiGenerated: true,
              },
            });
            controller.enqueue(
              encoder.encode(`event: complete\ndata: ${JSON.stringify({ brief: parsed })}\n\n`)
            );
          } catch {
            controller.enqueue(
              encoder.encode(`event: complete\ndata: ${JSON.stringify({ raw: fullContent })}\n\n`)
            );
          }
        } else {
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify({ raw: fullContent })}\n\n`)
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

function buildBriefPrompt(brief: {
  targetKeyword: string;
  secondaryKeywords: string[];
  title: string;
  contentType: string;
  wordCountTarget: number;
  notes: string | null;
  project: { name: string; industry: string | null };
}) {
  const secondaryList = brief.secondaryKeywords.length
    ? brief.secondaryKeywords.join(', ')
    : 'none specified';

  return `Generate a complete, production-ready content brief as a JSON object.

**Brief Inputs:**
- Company: ${brief.project.name}
- Industry: ${brief.project.industry ?? 'Not specified'}
- Primary Keyword: "${brief.targetKeyword}"
- Secondary Keywords: ${secondaryList}
- Working Title: "${brief.title}"
- Content Type: ${brief.contentType.replace('_', ' ')}
- Target Word Count: ${brief.wordCountTarget} words
- Additional Notes: ${brief.notes ?? 'None'}

**Return ONLY valid JSON in this exact schema (no markdown, no explanation):**
{
  "metaTitle": "60-char optimized meta title including primary keyword",
  "metaDescription": "155-char compelling meta description with keyword and CTA",
  "searchIntent": "informational | navigational | commercial | transactional",
  "targetAudience": "Specific audience description with pain points",
  "keyTakeaways": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "outline": [
    { "heading": "H1 Title", "type": "h1", "notes": "Hook + primary keyword in first 100 chars", "wordCount": 50 },
    { "heading": "Introduction section heading", "type": "h2", "notes": "What this section should cover", "wordCount": 200 },
    { "heading": "Subsection heading", "type": "h3", "notes": "Specific points to address", "wordCount": 150 }
  ],
  "internalLinkOpportunities": ["Description of page/topic to link to", "Another internal link opportunity"],
  "competitorReferences": ["Topic or angle a top-ranking competitor covers that we should address"],
  "ctaSuggestion": "Specific CTA text and placement recommendation"
}

The outline array should have 8-12 items (mix of h2 and h3) with word counts that total approximately ${brief.wordCountTarget} words. Make the outline highly specific to the keyword and content type — not generic.`;
}
