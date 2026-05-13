import Anthropic from '@anthropic-ai/sdk';
import { AgentType, getSystemPrompt } from './systemPrompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface StreamOptions {
  agentType: AgentType;
  command: string;
  projectContext?: string;
  revisionContext?: {
    originalCommand: string;
    previousOutput: string;
    revisionNote: string;
  };
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

function buildUserMessage(options: StreamOptions): string {
  if (options.revisionContext) {
    const { originalCommand, previousOutput, revisionNote } = options.revisionContext;
    return `ORIGINAL TASK:
${originalCommand}

YOUR PREVIOUS OUTPUT:
${previousOutput}

REVISION REQUESTED:
${revisionNote}

Please revise your output based on the feedback above. Maintain all elements that were not mentioned in the revision request.`;
  }

  const parts: string[] = [];
  if (options.projectContext) {
    parts.push(`PROJECT CONTEXT:\n${options.projectContext}\n`);
  }
  parts.push(`TASK:\n${options.command}`);
  return parts.join('\n');
}

export async function streamAgentResponse(options: StreamOptions): Promise<void> {
  const systemPrompt = getSystemPrompt(options.agentType);
  const userMessage = buildUserMessage(options);

  let fullText = '';

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    } as any);

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        const text = event.delta.text;
        fullText += text;
        options.onChunk(text);
      }
    }

    options.onComplete(fullText);
  } catch (err) {
    options.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export async function streamAgentResponseToSSE(
  options: StreamOptions,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<void> {
  const encoder = new TextEncoder();

  function send(event: string, data: unknown) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }

  await streamAgentResponse({
    ...options,
    onChunk: (text) => {
      send('chunk', { text });
    },
    onComplete: (fullText) => {
      send('complete', { fullText });
      controller.close();
    },
    onError: (error) => {
      send('error', { message: error.message });
      controller.close();
    },
  });
}
