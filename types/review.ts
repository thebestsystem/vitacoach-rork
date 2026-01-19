export interface WeeklyReview {
  id: string;
  userId: string;
  weekStartDate: string; // ISO Date string for the Monday of the week
  weekEndDate: string;   // ISO Date string for the Sunday of the week
  createdAt: string;

  // Part 1: Reflection
  wins: string;           // Text block for now to simplify UI
  improvements: string;   // "Ce qui pourrait être amélioré"
  lessons: string;        // "Leçons apprises"

  // Part 2: Scoring (1-10)
  productivityScore: number;
  energyScore: number;
  clarityScore: number;

  // Part 3: Strategy
  prioritiesNextWeek: string; // Text block of Top 3

  // Part 4: AI Coaching
  aiFeedback?: string;

  status: 'draft' | 'completed';
}
