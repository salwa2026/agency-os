import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description } = await req.json() as { title: string; description?: string };
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const prompt = description
    ? `Task: "${title}"\nContext: ${description}`
    : `Task: "${title}"`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: 'You are a project manager. Given a task title, return exactly 3 concise subtask suggestions as a JSON array of strings. Output ONLY the JSON array, no explanation.',
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = (msg.content[0] as { type: string; text: string }).text.trim();
  let suggestions: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    suggestions = Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    // Extract array-like content if model added text around it
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try { suggestions = JSON.parse(match[0]).slice(0, 3); } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ suggestions });
}
