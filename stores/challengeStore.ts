import { create } from 'zustand';
import { challengeService } from '@/services/challengeService';
import type { Challenge, ChallengeParticipant, LeaderboardEntry } from '@/types/health';

interface ChallengeState {
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;

  fetchChallenges: () => Promise<void>;
  createChallenge: (challenge: Omit<Challenge, 'id'>) => Promise<void>;
  joinChallenge: (challengeId: string, user: { uid: string; displayName?: string | null }) => Promise<void>;
  updateProgress: (challengeId: string, userId: string, progress: number) => Promise<void>;
  fetchLeaderboard: () => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  challenges: [],
  leaderboard: [],
  isLoading: false,
  error: null,

  fetchChallenges: async () => {
    set({ isLoading: true, error: null });
    try {
      const challenges = await challengeService.fetchChallenges();
      set({
        challenges,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  createChallenge: async (challengeData) => {
    set({ isLoading: true, error: null });
    try {
      await challengeService.createChallenge(challengeData);
      // Refresh list
      await get().fetchChallenges();
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  joinChallenge: async (challengeId, user) => {
    set({ isLoading: true, error: null });
    try {
      const participant: ChallengeParticipant = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        progress: 0,
        joinedAt: new Date().toISOString(),
        rank: 0 // Will be calculated
      };

      await challengeService.joinChallenge(challengeId, participant);
      await get().fetchChallenges();
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  updateProgress: async (challengeId, userId, progress) => {
    try {
      await challengeService.updateProgress(challengeId, userId, progress);

      const { challenges } = get();
      const updatedChallenges = challenges.map(c => {
        if (c.id === challengeId) {
          const updatedParticipants = c.participants.map(p =>
            p.userId === userId ? { ...p, progress } : p
          );
          // Re-rank
          updatedParticipants.sort((a, b) => b.progress - a.progress);
          updatedParticipants.forEach((p, idx) => p.rank = idx + 1);

          return { ...c, participants: updatedParticipants };
        }
        return c;
      });

      set({ challenges: updatedChallenges });

    } catch (error) {
      console.error("Failed to update progress locally", error);
    }
  },

  fetchLeaderboard: async () => {
      set({ isLoading: true, error: null });
      try {
          const leaderboard = await challengeService.fetchGlobalLeaderboard();
          set({ leaderboard, isLoading: false });
      } catch (error) {
          set({ isLoading: false, error: (error as Error).message });
      }
  }
}));
