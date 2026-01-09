import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  getDocs,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { createQueuedSync } from '@/utils/syncQueue';
import type {
  UserProfile,
  HealthMetrics,
  WorkoutPlan,
  MealPlan,
  WellnessCheckIn,
  MentalWellnessPlan,
  HealthHistory,
  ExerciseLog,
  MealLog,
  Achievement,
  Streak,
  WeeklyGoal,
  NotificationSettings,
  ReflectionEntry,
  ShoppingItem,
} from '@/types/health';

export const firestoreCollections = {
  users: 'users',
  healthMetrics: 'healthMetrics',
  workoutPlans: 'workoutPlans',
  mealPlans: 'mealPlans',
  wellnessCheckIns: 'wellnessCheckIns',
  mentalWellnessPlans: 'mentalWellnessPlans',
  healthHistory: 'healthHistory',
  exerciseLogs: 'exerciseLogs',
  mealLogs: 'mealLogs',
  reflections: 'reflections',
  shoppingList: 'shoppingList',
  gamification: 'gamification',
  userProfiles: 'userProfiles',
  onboarding: 'onboarding',
} as const;

type FirestoreCollectionName = typeof firestoreCollections[keyof typeof firestoreCollections];

export async function setUserDocument<T extends Record<string, any>>(
  userId: string,
  collectionName: FirestoreCollectionName,
  data: T
) {
  try {
    const docRef = doc(db, collectionName, userId);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
    console.log(`Document set in ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

export async function getUserDocument<T>(
  userId: string,
  collectionName: FirestoreCollectionName
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

export async function updateUserDocument<T>(
  userId: string,
  collectionName: FirestoreCollectionName,
  data: Partial<T>
) {
  try {
    const docRef = doc(db, collectionName, userId);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() } as any);
    console.log(`Document updated in ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteUserDocument(
  userId: string,
  collectionName: FirestoreCollectionName
) {
  try {
    const docRef = doc(db, collectionName, userId);
    await deleteDoc(docRef);
    console.log(`Document deleted from ${collectionName} for user ${userId}`);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

export async function getUserSubcollectionDocuments<T>(
  userId: string,
  collectionName: FirestoreCollectionName,
  subcollectionName: string
): Promise<T[]> {
  try {
    const q = query(
      collection(db, collectionName, userId, subcollectionName)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting subcollection ${subcollectionName}:`, error);
    throw error;
  }
}

export function subscribeToUserDocument<T>(
  userId: string,
  collectionName: FirestoreCollectionName,
  onUpdate: (data: T | null) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, collectionName, userId);
  
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as T);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

interface HealthData {
  userProfile: UserProfile | null;
  healthMetrics: HealthMetrics;
  workoutPlans: WorkoutPlan[];
  mealPlans: MealPlan[];
  wellnessCheckIns: WellnessCheckIn[];
  mentalWellnessPlans: MentalWellnessPlan[];
  healthHistory: HealthHistory[];
  exerciseLogs: ExerciseLog[];
  mealLogs: MealLog[];
  reflections: ReflectionEntry[];
  shoppingList: ShoppingItem[];
  onboardingComplete: boolean;
}

interface GamificationData {
  achievements: Achievement[];
  streaks: Streak[];
  weeklyGoals: WeeklyGoal[];
  notificationSettings: NotificationSettings;
  totalPoints: number;
}

async function _syncHealthDataToFirebase(
  userId: string,
  data: HealthData
): Promise<void> {
  try {
    console.log('Syncing health data to Firebase for user:', userId);
    
    await Promise.all([
      data.userProfile
        ? setUserDocument(userId, firestoreCollections.userProfiles, data.userProfile)
        : Promise.resolve(),
      setUserDocument(userId, firestoreCollections.healthMetrics, data.healthMetrics),
      setUserDocument(userId, firestoreCollections.workoutPlans, { plans: data.workoutPlans }),
      setUserDocument(userId, firestoreCollections.mealPlans, { plans: data.mealPlans }),
      setUserDocument(userId, firestoreCollections.wellnessCheckIns, { checkIns: data.wellnessCheckIns }),
      setUserDocument(userId, firestoreCollections.mentalWellnessPlans, { plans: data.mentalWellnessPlans }),
      setUserDocument(userId, firestoreCollections.healthHistory, { history: data.healthHistory }),
      setUserDocument(userId, firestoreCollections.exerciseLogs, { logs: data.exerciseLogs }),
      setUserDocument(userId, firestoreCollections.mealLogs, { logs: data.mealLogs }),
      setUserDocument(userId, firestoreCollections.reflections, { entries: data.reflections }),
      setUserDocument(userId, firestoreCollections.shoppingList, { items: data.shoppingList }),
      setUserDocument(userId, firestoreCollections.onboarding, { complete: data.onboardingComplete }),
    ]);
    
    console.log('Health data synced successfully');
  } catch (error) {
    console.error('Error syncing health data to Firebase:', error);
    throw error;
  }
}

export const syncHealthDataToFirebase = createQueuedSync(
  (userId: string, data: HealthData) => `health-sync-${userId}`,
  _syncHealthDataToFirebase,
  { debounce: true, priority: false }
);

export async function syncPartialHealthData(
  userId: string,
  updates: Partial<HealthData>
): Promise<void> {
  try {
    console.log('Syncing partial health data to Firebase for user:', userId);
    
    const promises: Promise<void>[] = [];

    if ('userProfile' in updates && updates.userProfile) {
      promises.push(setUserDocument(userId, firestoreCollections.userProfiles, updates.userProfile));
    }
    
    if ('healthMetrics' in updates && updates.healthMetrics) {
      promises.push(setUserDocument(userId, firestoreCollections.healthMetrics, updates.healthMetrics));
    }
    
    if ('workoutPlans' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.workoutPlans, { plans: updates.workoutPlans }));
    }
    
    if ('mealPlans' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.mealPlans, { plans: updates.mealPlans }));
    }
    
    if ('wellnessCheckIns' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.wellnessCheckIns, { checkIns: updates.wellnessCheckIns }));
    }
    
    if ('mentalWellnessPlans' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.mentalWellnessPlans, { plans: updates.mentalWellnessPlans }));
    }
    
    if ('healthHistory' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.healthHistory, { history: updates.healthHistory }));
    }
    
    if ('exerciseLogs' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.exerciseLogs, { logs: updates.exerciseLogs }));
    }
    
    if ('mealLogs' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.mealLogs, { logs: updates.mealLogs }));
    }

    if ('reflections' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.reflections, { entries: updates.reflections }));
    }

    if ('shoppingList' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.shoppingList, { items: updates.shoppingList }));
    }

    if ('onboardingComplete' in updates) {
      promises.push(setUserDocument(userId, firestoreCollections.onboarding, { complete: updates.onboardingComplete }));
    }
    
    await Promise.all(promises);
    console.log('Partial health data synced successfully');
  } catch (error) {
    console.error('Error syncing partial health data to Firebase:', error);
    throw error;
  }
}

export async function syncPartialGamificationData(
  userId: string,
  updates: Partial<GamificationData>
): Promise<void> {
  try {
    console.log('Syncing partial gamification data to Firebase for user:', userId);
    await updateUserDocument(userId, firestoreCollections.gamification, updates);
    console.log('Partial gamification data synced successfully');
  } catch (error) {
    console.error('Error syncing partial gamification data to Firebase:', error);
    throw error;
  }
}

async function _syncGamificationDataToFirebase(
  userId: string,
  data: GamificationData
): Promise<void> {
  try {
    console.log('Syncing gamification data to Firebase for user:', userId);
    
    await setUserDocument(userId, firestoreCollections.gamification, data);
    
    console.log('Gamification data synced successfully');
  } catch (error) {
    console.error('Error syncing gamification data to Firebase:', error);
    throw error;
  }
}

export const syncGamificationDataToFirebase = createQueuedSync(
  (userId: string, data: GamificationData) => `gamification-sync-${userId}`,
  _syncGamificationDataToFirebase,
  { debounce: true, priority: false }
);

export async function loadHealthDataFromFirebase(
  userId: string
): Promise<HealthData | null> {
  try {
    console.log('Loading health data from Firebase for user:', userId);
    
    const results = await Promise.allSettled([
      getUserDocument<UserProfile>(userId, firestoreCollections.userProfiles),
      getUserDocument<HealthMetrics>(userId, firestoreCollections.healthMetrics),
      getUserDocument<{ plans: WorkoutPlan[] }>(userId, firestoreCollections.workoutPlans),
      getUserDocument<{ plans: MealPlan[] }>(userId, firestoreCollections.mealPlans),
      getUserDocument<{ checkIns: WellnessCheckIn[] }>(userId, firestoreCollections.wellnessCheckIns),
      getUserDocument<{ plans: MentalWellnessPlan[] }>(userId, firestoreCollections.mentalWellnessPlans),
      getUserDocument<{ history: HealthHistory[] }>(userId, firestoreCollections.healthHistory),
      getUserDocument<{ logs: ExerciseLog[] }>(userId, firestoreCollections.exerciseLogs),
      getUserDocument<{ logs: MealLog[] }>(userId, firestoreCollections.mealLogs),
      getUserDocument<{ entries: ReflectionEntry[] }>(userId, firestoreCollections.reflections),
      getUserDocument<{ items: ShoppingItem[] }>(userId, firestoreCollections.shoppingList),
      getUserDocument<{ complete: boolean }>(userId, firestoreCollections.onboarding),
    ]);
    
    const userProfile = results[0].status === 'fulfilled' ? results[0].value : null;
    const healthMetrics = results[1].status === 'fulfilled' ? results[1].value : null;
    const workoutPlans = results[2].status === 'fulfilled' ? results[2].value : null;
    const mealPlans = results[3].status === 'fulfilled' ? results[3].value : null;
    const wellnessCheckIns = results[4].status === 'fulfilled' ? results[4].value : null;
    const mentalWellnessPlans = results[5].status === 'fulfilled' ? results[5].value : null;
    const healthHistory = results[6].status === 'fulfilled' ? results[6].value : null;
    const exerciseLogs = results[7].status === 'fulfilled' ? results[7].value : null;
    const mealLogs = results[8].status === 'fulfilled' ? results[8].value : null;
    const reflections = results[9].status === 'fulfilled' ? results[9].value : null;
    const shoppingList = results[10].status === 'fulfilled' ? results[10].value : null;
    const onboarding = results[11].status === 'fulfilled' ? results[11].value : null;
    
    if (!healthMetrics && !userProfile && !onboarding) {
      console.log('No health data found in Firebase, returning null');
      return null;
    }
    
    return {
      userProfile,
      healthMetrics: healthMetrics || { steps: 0 },
      workoutPlans: workoutPlans?.plans || [],
      mealPlans: mealPlans?.plans || [],
      wellnessCheckIns: wellnessCheckIns?.checkIns || [],
      mentalWellnessPlans: mentalWellnessPlans?.plans || [],
      healthHistory: healthHistory?.history || [],
      exerciseLogs: exerciseLogs?.logs || [],
      mealLogs: mealLogs?.logs || [],
      reflections: reflections?.entries || [],
      shoppingList: shoppingList?.items || [],
      onboardingComplete: onboarding?.complete || false,
    };
  } catch (error) {
    console.error('Error loading health data from Firebase:', error);
    throw error;
  }
}

export async function loadGamificationDataFromFirebase(
  userId: string
): Promise<GamificationData | null> {
  try {
    console.log('Loading gamification data from Firebase for user:', userId);
    
    const data = await getUserDocument<GamificationData>(userId, firestoreCollections.gamification);
    
    return data;
  } catch (error) {
    console.error('Error loading gamification data from Firebase:', error);
    throw error;
  }
}
