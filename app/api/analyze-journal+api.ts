import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { content, context } = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), { status: 400 });
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        summary: z.string().describe('A concise summary of the journal entry.'),
        sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).describe('The overall sentiment.'),
        key_insights: z.array(z.string()).describe('3-5 key insights or patterns derived from the entry.'),
        actionable_advice: z.string().describe('One concrete, high-impact piece of advice for the founder based on this entry.'),
        strategic_score: z.number().min(1).max(10).describe('A score indicating how well aligned this entry is with high-performance leadership (1-10).'),
        tags: z.array(z.string()).describe('Relevant tags for categorization (e.g., "Leadership", "Productivity", "Well-being").'),
      }),
      messages: [
        {
          role: 'system',
          content: `You are an expert Executive Coach for high-performance founders.
          Analyze the user's journal entry.
          Your goal is to provide strategic clarity, emotional intelligence feedback, and actionable advice.
          Be direct, encouraging, but rigorous.
          Context about user: ${JSON.stringify(context || {})}
          Language: French (Français).
          `
        },
        {
          role: 'user',
          content: content,
        },
      ],
    });

    return new Response(JSON.stringify(result.object), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Journal Analysis Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to analyze journal' }), { status: 500 });
  }
}
