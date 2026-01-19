import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { WeeklyReview } from '@/types/review';

const COLLECTION_NAME = 'weekly_reviews';

export const reviewService = {
  /**
   * Fetch all completed reviews for a user, ordered by date descending
   */
  async fetchReviews(userId: string): Promise<WeeklyReview[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('weekStartDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WeeklyReview[];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  },

  /**
   * Get a specific review by ID
   */
  async getReviewById(reviewId: string): Promise<WeeklyReview | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, reviewId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WeeklyReview;
      }
      return null;
    } catch (error) {
      console.error('Error getting review:', error);
      throw error;
    }
  },

  /**
   * Create or overwrite a review for a specific week
   */
  async saveReview(review: Omit<WeeklyReview, 'id'>): Promise<string> {
    try {
      // Check if a review already exists for this user and week
      const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', review.userId),
        where('weekStartDate', '==', review.weekStartDate),
        limit(1)
      );

      const existingDocs = await getDocs(q);

      if (!existingDocs.empty) {
        // Update existing
        const docId = existingDocs.docs[0].id;
        const docRef = doc(db, COLLECTION_NAME, docId);
        await updateDoc(docRef, { ...review });
        return docId;
      } else {
        // Create new
        const docRef = await addDoc(collection(db, COLLECTION_NAME), review);
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving review:', error);
      throw error;
    }
  },

  /**
   * Check if a review exists for the current week
   */
  async hasReviewForWeek(userId: string, weekStartDate: string): Promise<boolean> {
      try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where('userId', '==', userId),
            where('weekStartDate', '==', weekStartDate),
            limit(1)
        );
        const snapshot = await getDocs(q);
        return !snapshot.empty;
      } catch (error) {
          console.error('Error checking review existence:', error);
          return false;
      }
  }
};
