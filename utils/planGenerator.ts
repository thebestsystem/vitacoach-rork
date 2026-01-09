import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { UserProfile, WorkoutPlan, MealPlan, MentalWellnessPlan } from "@/types/health";
import { logger } from "@/utils/logger";

const workoutPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  exercises: z.array(
    z.object({
      name: z.string(),
      duration: z.number().optional(),
      reps: z.number().optional(),
      sets: z.number().optional(),
      rest: z.number().optional(),
    })
  ),
});

const mealPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  totalCalories: z.number(),
  meals: z.array(
    z.object({
      type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      name: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fats: z.number(),
      description: z.string().optional(),
    })
  ),
});

const mentalWellnessPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  category: z.enum(["stress_management", "meditation", "breathing", "mindfulness", "sleep_improvement"]),
  activities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      duration: z.number(),
      frequency: z.string(),
      benefits: z.array(z.string()).optional(),
    })
  ),
});

export class PlanGenerationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "PlanGenerationError";
  }
}

export async function generateWorkoutPlan(
  userProfile: UserProfile,
  userRequest: string
): Promise<WorkoutPlan> {
  try {
    const cycleInfo = userProfile.menstrualCycle
      ? `- Menstrual Cycle: Phase ${userProfile.menstrualCycle.phase || "unknown"}`
      : "";

    const profileContext = `
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age || "Not specified"}
- Gender: ${userProfile.gender || "Not specified"}
- Fitness Level: ${userProfile.fitnessLevel || "Not specified"}
- Goals: ${userProfile.goals.join(", ")}
- Health Conditions: ${userProfile.healthConditions?.join(", ") || "None"}
${cycleInfo}
`;

    const result = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: `${profileContext}

User Request: ${userRequest}

Create a personalized workout plan that matches the user's fitness level, goals, and any health conditions. 
Include specific exercises with proper sets, reps, duration, and rest periods. Make it realistic and achievable.
If a menstrual cycle phase is provided, adapt intensity accordingly (e.g., lower intensity for luteal/menstrual phases, higher for follicular/ovulation).`,
        },
      ],
      schema: workoutPlanSchema,
    });

    return {
      id: Date.now().toString(),
      ...result.object,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to generate workout plan", error as Error, "PlanGenerator");
    throw new PlanGenerationError("Failed to generate workout plan. Please try again later.", error);
  }
}

export async function generateMealPlan(
  userProfile: UserProfile,
  userRequest: string
): Promise<MealPlan> {
  try {
    const profileContext = `
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age || "Not specified"}
- Gender: ${userProfile.gender || "Not specified"}
- Weight: ${userProfile.weight || "Not specified"} kg
- Height: ${userProfile.height || "Not specified"} cm
- Goals: ${userProfile.goals.join(", ")}
- Dietary Preferences: ${userProfile.dietaryPreferences?.join(", ") || "None"}
- Allergies: ${userProfile.allergies?.join(", ") || "None"}
`;

    const result = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: `${profileContext}

User Request: ${userRequest}

Create a personalized meal plan for one day that aligns with the user's goals and dietary preferences. 
Include breakfast, lunch, dinner, and snacks with accurate nutritional information (calories, protein, carbs, fats).
Avoid any ingredients related to the user's allergies. Make meals realistic and appealing.`,
        },
      ],
      schema: mealPlanSchema,
    });

    return {
      id: Date.now().toString(),
      ...result.object,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to generate meal plan", error as Error, "PlanGenerator");
    throw new PlanGenerationError("Failed to generate meal plan. Please try again later.", error);
  }
}

export async function generateMentalWellnessPlan(
  userProfile: UserProfile,
  userRequest: string
): Promise<MentalWellnessPlan> {
  try {
    const profileContext = `
User Profile:
- Name: ${userProfile.name}
- Age: ${userProfile.age || "Not specified"}
- Goals: ${userProfile.goals.join(", ")}
- Health Conditions: ${userProfile.healthConditions?.join(", ") || "None"}
`;

    const result = await generateObject({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: `${profileContext}

User Request: ${userRequest}

Create a personalized mental wellness program focused on improving mental health, stress management, sleep, or mindfulness.
Include specific activities with durations, frequencies, and clear benefits. Make it practical and achievable for daily life.`,
        },
      ],
      schema: mentalWellnessPlanSchema,
    });

    return {
      id: Date.now().toString(),
      ...result.object,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Failed to generate wellness plan", error as Error, "PlanGenerator");
    throw new PlanGenerationError("Failed to generate wellness plan. Please try again later.", error);
  }
}
