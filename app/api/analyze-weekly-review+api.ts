import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const {
      wins,
      improvements,
      lessons,
      prioritiesNextWeek,
      journalSummaries, // Array of journal summaries from the past week
      userContext
    } = await req.json();

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        coachFeedback: z.string().describe('A comprehensive paragraph (in French) giving feedback on the week and the plan for the next one. Be encouraging but challenging.'),
        suggestedFocus: z.string().describe('A single short sentence suggesting a specific mindset or focus area for the upcoming week based on the data.'),
        strategicAlignmentScore: z.number().min(1).max(100).describe('A calculated percentage score (1-100) of how aligned the user is with their long-term vision based on this review.'),
      }),
      messages: [
        {
          role: 'system',
          content: `You are Vita, an elite Executive Coach for high-performance founders.
          You are analyzing a Weekly Review (Bilan Hebdomadaire).

          Data provided:
          - Wins (Ce qui a bien marché)
          - Improvements (Ce qui peut être amélioré)
          - Lessons (Leçons apprises)
          - Priorities for Next Week
          - Journal Summaries from the week (Context)

          Your Goal:
          1. Synthesize the week's performance.
          2. Connect the dots between their daily journal entries and their weekly review.
          3. Validate if their "Priorities for Next Week" address the "Improvements" identified.
          4. Provide a punchy, high-level feedback summary.

          Tone: Professional, Stoic, Strategic, in French.
          `
        },
        {
          role: 'user',
          content: JSON.stringify({
            wins,
            improvements,
            lessons,
            prioritiesNextWeek,
            journalSummaries,
            userContext
          }),
        },
      ],
    });

    return new Response(JSON.stringify(result.object), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Weekly Review Analysis Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to analyze weekly review' }), { status: 500 });
  }
}
