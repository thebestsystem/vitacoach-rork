export interface JournalEntry {
  id: string;
  date: string; // ISO String
  content: string;
  tags: string[];
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  analysis?: {
    summary: string;
    key_insights: string[];
    actionable_advice: string;
    strategic_score: number; // 1-10 alignment with goals
  };
  mood?: string; // Emoji
}

export type JournalPrompt = {
  id: string;
  text: string;
  category: 'reflection' | 'strategy' | 'gratitude' | 'problem-solving';
};
