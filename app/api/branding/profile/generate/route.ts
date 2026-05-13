import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const member = await prisma.projectMember.findFirst({
    where: { projectId, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const profile = await prisma.brandProfile.findUnique({ where: { projectId } });
  if (!profile) return NextResponse.json({ error: 'Brand profile not found. Save your profile first.' }, { status: 400 });

  const prompt = buildGuidelinesPrompt(profile);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullDoc = '';

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 8000,
          thinking: { type: 'adaptive' },
          system: `You are a senior brand strategist and creative director. You write comprehensive, professional brand guidelines documents in rich Markdown. Be specific, actionable, and visually descriptive. Use real hex codes, font names, and concrete examples.`,
          messages: [{ role: 'user', content: prompt }],
        } as any);

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullDoc += event.delta.text;
            controller.enqueue(
              encoder.encode(`event: chunk\ndata: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            );
          }
        }

        await prisma.brandProfile.update({
          where: { projectId },
          data: { guidelinesDoc: fullDoc, guidelinesGeneratedAt: new Date() },
        });

        controller.enqueue(
          encoder.encode(`event: complete\ndata: ${JSON.stringify({ doc: fullDoc })}\n\n`)
        );
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
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}

function buildGuidelinesPrompt(profile: {
  companyName: string | null; tagline: string | null; mission: string | null;
  vision: string | null; values: string[]; primaryColor: string | null;
  secondaryColor: string | null; accentColor: string | null; neutralColor: string | null;
  primaryFont: string | null; secondaryFont: string | null; toneOfVoice: string[];
  targetAudience: string | null; competitors: string[]; industry: string | null;
}) {
  return `Generate a comprehensive brand guidelines document for the following brand.

**Brand Details:**
- Company: ${profile.companyName ?? 'Not specified'}
- Industry: ${profile.industry ?? 'Not specified'}
- Tagline: ${profile.tagline ?? 'Not specified'}
- Mission: ${profile.mission ?? 'Not specified'}
- Vision: ${profile.vision ?? 'Not specified'}
- Core Values: ${profile.values.length ? profile.values.join(', ') : 'Not specified'}
- Target Audience: ${profile.targetAudience ?? 'Not specified'}
- Tone of Voice: ${profile.toneOfVoice.length ? profile.toneOfVoice.join(', ') : 'Not specified'}
- Competitors: ${profile.competitors.length ? profile.competitors.join(', ') : 'Not specified'}

**Colors:**
- Primary: ${profile.primaryColor ?? 'Not specified'}
- Secondary: ${profile.secondaryColor ?? 'Not specified'}
- Accent: ${profile.accentColor ?? 'Not specified'}
- Neutral: ${profile.neutralColor ?? 'Not specified'}

**Typography:**
- Primary Font: ${profile.primaryFont ?? 'Not specified'}
- Secondary Font: ${profile.secondaryFont ?? 'Not specified'}

Write a complete brand guidelines document in Markdown with these sections:

# Brand Guidelines: [Company Name]

## 1. Brand Overview
Brief brand story, positioning statement, and market differentiation.

## 2. Mission, Vision & Values
Detailed explanation of each value and how it manifests in work.

## 3. Brand Voice & Tone
- Voice characteristics (3-5 adjectives with explanations)
- Writing style rules
- Do's and Don'ts table with examples
- Sample copy in brand voice vs. off-brand copy

## 4. Visual Identity
### 4.1 Color Palette
For each color: name, hex code, RGB values, usage rules (primary, supporting, accent, backgrounds).
### 4.2 Typography
Font pairing logic, hierarchy rules (H1–H4 sizes), body copy specs, web-safe fallbacks.
### 4.3 Logo Usage
Clear space rules, minimum sizes, approved background colors, forbidden uses.
### 4.4 Imagery Style
Photography style, illustration style, icon style guidelines.

## 5. Target Audience
Detailed persona breakdown with demographics, psychographics, pain points, and messaging hooks.

## 6. Competitive Positioning
Brief competitor landscape and our unique positioning.

## 7. Brand Application Examples
Headlines and taglines, social media post examples, email subject line examples, CTA examples.

## 8. Brand Checklist
Quick-reference checklist for designers, writers, and marketers.

Make every section specific and actionable based on the brand details provided.`;
}
