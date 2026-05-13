import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const file = await prisma.dataFile.findFirst({
    where: {
      id: params.id,
      project: { members: { some: { userId: session.user.id } } },
    },
  });
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const question: string = body.question ?? '';

  // Create analysis record
  const analysis = await prisma.dataAnalysis.create({
    data: {
      fileId: file.id,
      projectId: file.projectId,
      question: question || null,
      status: 'processing',
      createdById: session.user.id,
    },
  });

  const sampleRows = (file.fullData as Record<string, unknown>[]).slice(0, 40);
  const prompt = buildAnalysisPrompt(file, sampleRows, question);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = '';

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 6000,
          thinking: { type: 'adaptive' },
          system: `You are an expert data analyst. Analyze datasets and return structured JSON insights with chart configurations. Always respond with valid JSON only — no markdown fences, no explanation.`,
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

        // Parse and save
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const updated = await prisma.dataAnalysis.update({
            where: { id: analysis.id },
            data: {
              status: 'complete',
              title: parsed.title ?? `Analysis of ${file.name}`,
              summary: parsed.summary ?? null,
              insights: parsed.insights ?? null,
              metrics: parsed.metrics ?? null,
              charts: parsed.charts ?? null,
              recommendations: parsed.recommendations ?? null,
              rawOutput: fullContent,
            },
          });
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify({ analysis: updated })}\n\n`)
          );
        } else {
          await prisma.dataAnalysis.update({
            where: { id: analysis.id },
            data: { status: 'complete', rawOutput: fullContent },
          });
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify({ analysisId: analysis.id, raw: fullContent })}\n\n`)
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Analysis failed';
        await prisma.dataAnalysis.update({
          where: { id: analysis.id },
          data: { status: 'failed' },
        });
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

function buildAnalysisPrompt(
  file: { name: string; headers: string[]; rowCount: number; columnCount: number },
  sampleRows: Record<string, unknown>[],
  question: string,
): string {
  const headerList = file.headers.join(', ');
  const sampleJSON = JSON.stringify(sampleRows, null, 0).slice(0, 8000);

  return `Analyze the following dataset and return a comprehensive JSON report.

**Dataset:** "${file.name}"
**Shape:** ${file.rowCount} rows × ${file.columnCount} columns
**Columns:** ${headerList}
${question ? `**Specific Question:** ${question}` : ''}

**Sample Data (first ${sampleRows.length} rows):**
${sampleJSON}

Return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "title": "Short descriptive analysis title",
  "summary": "3-4 sentence executive summary of key findings",
  "insights": [
    "Specific data insight 1",
    "Specific data insight 2",
    "Specific data insight 3",
    "Specific data insight 4",
    "Specific data insight 5"
  ],
  "metrics": [
    { "label": "Total Records", "value": "${file.rowCount}", "icon": "📊" },
    { "label": "Metric Name", "value": "computed value", "change": "+12%", "icon": "📈" }
  ],
  "charts": [
    {
      "id": "chart_1",
      "type": "bar",
      "title": "Chart Title",
      "description": "What this chart shows",
      "xKey": "column_name_for_x_axis",
      "yKey": "column_name_for_y_axis",
      "data": [
        { "column_name_for_x_axis": "value1", "column_name_for_y_axis": 100 },
        { "column_name_for_x_axis": "value2", "column_name_for_y_axis": 200 }
      ]
    }
  ],
  "recommendations": [
    "Actionable recommendation based on the data",
    "Another specific recommendation"
  ]
}

Rules:
- Charts must use REAL data aggregated from the sample, not placeholder values
- Include 2-4 charts of different types (bar, line, pie, area) where relevant
- Metrics must reference actual computed values from the data
- Insights must be specific and data-driven, not generic statements
- If a specific question was asked, focus the analysis on answering it`;
}
