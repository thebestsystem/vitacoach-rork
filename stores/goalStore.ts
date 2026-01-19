import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalStatus } from '@/types/goal';

interface GoalState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'keyResults'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getGoal: (id: string) => Goal | undefined;
  toggleStatus: (id: string, status: GoalStatus) => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: Math.random().toString(36).substring(7),
          progress: 0,
          keyResults: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          goals: [newGoal, ...state.goals],
        }));
      },
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        }));
      },
      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },
      getGoal: (id) => get().goals.find((g) => g.id === id),
      toggleStatus: (id, status) => {
        set((state) => ({
            goals: state.goals.map((g) =>
                g.id === id ? { ...g, status, updatedAt: new Date().toISOString() } : g
            ),
        }));
      }
    }),
    {
      name: 'goal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
