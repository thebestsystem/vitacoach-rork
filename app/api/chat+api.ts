
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages, userName, userGoals, healthContext, userRole } = await req.json();

    const name = userName || 'Champion';
    const goals = userGoals || 'optimize performance';
    const role = userRole || 'high performer';

    // Construct context string from health data if available
    let contextStr = "";
    if (healthContext) {
        if (healthContext.steps !== undefined) contextStr += `Steps: ${healthContext.steps}. `;
        if (healthContext.sleep !== undefined) contextStr += `Sleep: ${healthContext.sleep}h. `;
        if (healthContext.mood) contextStr += `Mood: ${healthContext.mood}. `;
        if (healthContext.energy) contextStr += `Energy: ${healthContext.energy}/10. `;
        if (healthContext.stress) contextStr += `Stress: ${healthContext.stress}/10. `;
    }

    // Role-specific nuances
    let roleNuance = "";
    if (role === 'founder' || role === 'solopreneur') {
        roleNuance = "Understand that they have very limited time and high stress. Focus on ROI of health habits. Frame advice as 'performance optimization'.";
    } else if (role === 'executive') {
        roleNuance = "Focus on leadership energy, mental clarity for decision making, and stress resilience.";
    }

    const result = streamText({
      model: openai('gpt-4o'),
      system: `You are 'Vita', an Elite Executive Performance Coach.
      You are coaching ${name}, who is a ${role}.
      Their primary goals: ${goals}.
      ${contextStr ? `Real-time Stats: ${contextStr}` : ''}

      YOUR MANIFESTO:
      1. Time is their most valuable asset. Be concise.
      2. Health is a business asset. Explain the ROI of your advice.
      3. No fluff. Go straight to actionable protocols.
      4. Tone: Professional, direct, encouraging, elite. Think "Performance Scientist" meets "Navy SEAL Commander".

      ${roleNuance}

      INSTRUCTIONS:
      - Keep responses short (max 2-3 sentences unless asked for a deep dive).
      - Use bullet points for protocols.
      - If they report low energy, give a 5-minute protocol to reset.
      - If they report high stress, give a physiological sigh breathing technique.
      - Always link health wins to professional wins (e.g., "Better sleep = sharper decisions").
      - If the user speaks a language other than English, reply in that language.
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), { status: 500 });
  }
}
