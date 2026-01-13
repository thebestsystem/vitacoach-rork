
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: 'Image is required' }), { status: 400 });
    }

    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        name: z.string().describe('A short, descriptive name of the meal'),
        calories: z.number().describe('Estimated total calories'),
        protein: z.number().describe('Estimated protein in grams'),
        carbs: z.number().describe('Estimated carbohydrates in grams'),
        fats: z.number().describe('Estimated fats in grams'),
        analysis_summary: z.string().describe('A brief explanation of the analysis and portion estimation'),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this food image. Estimate the calories and macronutrients. Be precise but realistic.' },
            { type: 'image', image: image },
          ],
        },
      ],
    });

    return new Response(JSON.stringify(result.object), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Food Analysis Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to analyze food' }), { status: 500 });
  }
}
