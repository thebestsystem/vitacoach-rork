import { describe, it, expect, mock, beforeEach } from "bun:test";
import { useChallengeStore } from "@/stores/challengeStore";
import { challengeService } from "@/services/challengeService";

// Mock the service
mock.module("@/services/challengeService", () => ({
  challengeService: {
    fetchChallenges: mock(() => Promise.resolve([])),
    createChallenge: mock(() => Promise.resolve("new-challenge-id")),
    joinChallenge: mock(() => Promise.resolve()),
    updateProgress: mock(() => Promise.resolve()),
    fetchGlobalLeaderboard: mock(() => Promise.resolve([
        { userId: 'u1', userName: 'User 1', score: 100, rank: 1, achievements: 5, weeklyWorkouts: 2 },
        { userId: 'u2', userName: 'User 2', score: 90, rank: 2, achievements: 3, weeklyWorkouts: 1 }
    ])),
  },
}));

describe("Challenge Store", () => {
  beforeEach(() => {
    // Reset store state if possible, or just rely on fresh mocks
    useChallengeStore.setState({ challenges: [], leaderboard: [], isLoading: false, error: null });
  });

  it("should fetch challenges successfully", async () => {
    const { fetchChallenges } = useChallengeStore.getState();
    await fetchChallenges();
    const state = useChallengeStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(challengeService.fetchChallenges).toHaveBeenCalled();
  });

  it("should create a challenge", async () => {
      const { createChallenge } = useChallengeStore.getState();
      const challengeData = {
          title: "Test Challenge",
          description: "Desc",
          type: "steps",
          goal: 1000,
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
          participants: [],
          createdBy: "user1",
          icon: "👟"
      };

      await createChallenge(challengeData as any);
      const state = useChallengeStore.getState();
      expect(state.isLoading).toBe(false);
      expect(challengeService.createChallenge).toHaveBeenCalledWith(challengeData);
      // It also refetches
      expect(challengeService.fetchChallenges).toHaveBeenCalled();
  });

  it("should fetch global leaderboard", async () => {
      const { fetchLeaderboard } = useChallengeStore.getState();
      await fetchLeaderboard();
      const state = useChallengeStore.getState();
      expect(state.leaderboard).toHaveLength(2);
      expect(state.leaderboard[0].userName).toBe("User 1");
      expect(challengeService.fetchGlobalLeaderboard).toHaveBeenCalled();
  });
});
