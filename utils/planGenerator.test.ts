import { generateWorkoutPlan, PlanGenerationError } from '@/utils/planGenerator';
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));

// Mock logger to avoid cluttering test output
vi.mock("@/utils/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('generateWorkoutPlan', () => {
  const mockUserProfile = {
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    goals: ['strength'],
    fitnessLevel: 'intermediate',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully generate a workout plan', async () => {
    const mockResult = {
      object: {
        title: 'Strength Training',
        description: 'A focused strength workout',
        duration: 45,
        difficulty: 'medium',
        exercises: [
          { name: 'Push-ups', sets: 3, reps: 10 }
        ]
      }
    };

    (generateObject as any).mockResolvedValue(mockResult);

    const plan = await generateWorkoutPlan(mockUserProfile as any, 'I want to get stronger');

    expect(plan).toBeDefined();
    expect(plan.title).toBe('Strength Training');
    expect(plan.exercises).toHaveLength(1);
    expect(plan.id).toBeDefined();
    expect(generateObject).toHaveBeenCalledWith(expect.objectContaining({
      schema: expect.any(Object), // zod schema
    }));
  });

  it('should throw PlanGenerationError when API fails', async () => {
    const error = new Error('API Error');
    (generateObject as any).mockRejectedValue(error);

    await expect(generateWorkoutPlan(mockUserProfile as any, 'request'))
      .rejects
      .toThrow(PlanGenerationError);
  });
});
