import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeeklyReview } from '@/types/review';
import { reviewService } from '@/services/reviewService';

interface ReviewState {
  reviews: WeeklyReview[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReviews: (userId: string) => Promise<void>;
  addReview: (review: Omit<WeeklyReview, 'id'>) => Promise<void>;
  hasReviewForCurrentWeek: (userId: string) => Promise<boolean>;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      reviews: [],
      isLoading: false,
      error: null,

      fetchReviews: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const reviews = await reviewService.fetchReviews(userId);
          set({ reviews, isLoading: false });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
        }
      },

      addReview: async (reviewData) => {
        set({ isLoading: true, error: null });
        try {
          const id = await reviewService.saveReview(reviewData);
          const newReview = { ...reviewData, id };

          set((state) => {
            // Remove existing if any (update case)
            const filtered = state.reviews.filter(r => r.weekStartDate !== reviewData.weekStartDate);
            return {
                reviews: [newReview, ...filtered],
                isLoading: false
            };
          });
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },

      hasReviewForCurrentWeek: async (userId: string) => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(today.setDate(diff));
        monday.setHours(0,0,0,0);
        const mondayStr = monday.toISOString();

        // Check local store first
        const local = get().reviews.find(r => r.weekStartDate === mondayStr && r.status === 'completed');
        if (local) return true;

        // Check server
        return await reviewService.hasReviewForWeek(userId, mondayStr);
      }
    }),
    {
      name: 'review-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ reviews: state.reviews }), // Only persist data, not status flags
    }
  )
);
