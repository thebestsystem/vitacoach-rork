
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, userName, userGoals, healthContext } = await req.json();

    const name = userName || 'Friend';
    const goals = userGoals || 'general wellness';

    // Construct context string from health data if available
    let contextStr = "";
    if (healthContext) {
        if (healthContext.steps !== undefined) contextStr += `Today's Steps: ${healthContext.steps}. `;
        if (healthContext.sleep !== undefined) contextStr += `Last Night's Sleep: ${healthContext.sleep} hrs. `;
        if (healthContext.mood) contextStr += `Current Mood: ${healthContext.mood}. `;
        if (healthContext.energy) contextStr += `Energy Level: ${healthContext.energy}. `;
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are Sarah Jenkins, a Holistic Wellness & HIIT Coach.
      You are currently in a live 1:1 video session with a client named ${name}.
      Their stated goals are: ${goals}.
      ${contextStr ? `Current Status: ${contextStr}` : ''}

      Your personality is energetic, encouraging, but grounded and mindful.
      You focus on form, breathing, and mental resilience.
      Keep your responses short, conversational, and punchy (under 2 sentences) as you are "speaking" them during a workout.
      Use emojis occasionally.
      If the user says they are tired, encourage them to push through but listen to their body.
      If they ask about form, give specific, quick cues.
      Refer to their goals (${goals}) when motivating them.
      If the user speaks a language other than English, reply in that language.
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), { status: 500 });
  }
}
