import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  Timestamp,
  arrayUnion,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Challenge, ChallengeParticipant, LeaderboardEntry } from '@/types/health';

const COLLECTION_NAME = 'challenges';
const GAMIFICATION_COLLECTION = 'gamification';
const USERS_COLLECTION = 'users'; // or userProfiles

export const challengeService = {
  async fetchChallenges(): Promise<Challenge[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME));
      const querySnapshot = await getDocs(q);

      const challenges = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Challenge[];

      return challenges;
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  },

  async createChallenge(challenge: Omit<Challenge, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...challenge,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  async joinChallenge(challengeId: string, participant: ChallengeParticipant): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, challengeId);
      await updateDoc(docRef, {
        participants: arrayUnion(participant)
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  },

  async updateProgress(challengeId: string, userId: string, progress: number): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, challengeId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) throw new Error('Challenge not found');

      const challenge = docSnap.data() as Challenge;
      const participants = challenge.participants.map(p => {
        if (p.userId === userId) {
          return { ...p, progress };
        }
        return p;
      });

      // Calculate rank
      participants.sort((a, b) => b.progress - a.progress);
      participants.forEach((p, index) => {
        p.rank = index + 1;
      });

      await updateDoc(docRef, { participants });
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  },

  async getChallengeById(challengeId: string): Promise<Challenge | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, challengeId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Challenge;
      }
      return null;
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  },

  async fetchGlobalLeaderboard(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    try {
      const q = query(
        collection(db, GAMIFICATION_COLLECTION),
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);

      // We need to fetch user names.
      // In a real app, 'gamification' doc might not have names.
      // We should probably store a 'displayName' snapshot in gamification or fetch profiles.
      // For now, let's assume we might need to fetch profiles, or we hope displayName is in gamification (it's not).
      // Optimization: The 'gamification' document *could* have 'displayName' synced.
      // Or we fetch userProfiles.

      const entries: LeaderboardEntry[] = [];

      // Parallel fetch of profiles is cleaner but might be heavy.
      // Let's iterate.
      let rank = 1;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const userId = docSnap.id;

        // Try to get name from profile
        let userName = 'Unknown User';
        try {
            // Note: This causes N+1 reads. For "ASAP" and MVP it's acceptable for small N (20).
            const profileSnap = await getDoc(doc(db, 'userProfiles', userId));
            if (profileSnap.exists()) {
                userName = profileSnap.data().name || 'Anonymous';
            }
        } catch (e) {
            console.warn(`Could not fetch profile for ${userId}`, e);
        }

        // Calculate trends/achievements from data
        // data.achievements is an array
        const achievementsCount = Array.isArray(data.achievements) ? data.achievements.filter((a: any) => a.unlocked).length : 0;

        entries.push({
            userId,
            userName,
            score: data.totalPoints || 0,
            rank: rank++,
            trend: 'same', // Hard to calculate without history
            achievements: achievementsCount,
            weeklyWorkouts: data.streaks?.find((s: any) => s.type === 'workout')?.current || 0
        });
      }

      return entries;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Fallback to empty
      return [];
    }
  }
};
