import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FocusMode = 'deep' | 'pomodoro' | 'shallow';

export interface FocusSession {
  id: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
  mode: FocusMode;
  completed: boolean;
}

interface FocusState {
  status: 'idle' | 'focusing' | 'paused';
  timeLeft: number;
  mode: FocusMode;
  startTime: number | null;
  endTime: number | null; // target end time in ms
  history: FocusSession[];

  // Actions
  startFocus: (mode?: FocusMode) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: (completed?: boolean) => void;
  setMode: (mode: FocusMode) => void;
  tick: () => void;
}

const MODES = {
  deep: 90 * 60, // 90 minutes
  pomodoro: 25 * 60, // 25 minutes
  shallow: 15 * 60, // 15 minutes
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      timeLeft: MODES.deep,
      mode: 'deep',
      startTime: null,
      endTime: null,
      history: [],

      setMode: (mode) => set({ mode, timeLeft: MODES[mode], status: 'idle', startTime: null, endTime: null }),

      startFocus: (mode) => {
        const currentMode = mode || get().mode;
        const now = Date.now();
        // If starting from idle, use full duration. If from pause (which should use resume), use timeLeft.
        // But startFocus can also be used to restart.
        const durationSeconds = MODES[currentMode];

        set({
          status: 'focusing',
          mode: currentMode,
          startTime: now,
          endTime: now + durationSeconds * 1000,
          timeLeft: durationSeconds,
        });
      },

      pauseFocus: () => {
         // When pausing, we just keep the current timeLeft which is updated by tick.
         // No need to clear startTime/endTime strictly, but maybe good to clear endTime so we know we are not running.
         set({ status: 'paused', endTime: null });
      },

      resumeFocus: () => {
         const { timeLeft } = get();
         const now = Date.now();
         set({
             status: 'focusing',
             endTime: now + timeLeft * 1000
         });
      },

      stopFocus: (completed = false) => {
        const { startTime, mode, timeLeft } = get();
        // Calculate duration based on what was actually spent?
        // If we just use MODES[mode] - timeLeft, it's correct for the "session work done".
        const duration = MODES[mode] - timeLeft;

        if (startTime && duration > 0) {
            const session: FocusSession = {
                id: Math.random().toString(36).substr(2, 9),
                startTime,
                endTime: Date.now(),
                duration,
                mode,
                completed
            };
            set((state) => ({
                history: [...state.history, session],
                status: 'idle',
                startTime: null,
                endTime: null,
                timeLeft: MODES[mode]
            }));
        } else {
             set((state) => ({
                status: 'idle',
                startTime: null,
                endTime: null,
                timeLeft: MODES[state.mode]
            }));
        }
      },

      tick: () => {
        const { status, endTime, stopFocus } = get();
        if (status === 'focusing' && endTime) {
          const now = Date.now();
          const secondsLeft = Math.ceil((endTime - now) / 1000);

          if (secondsLeft <= 0) {
            set({ timeLeft: 0 });
            stopFocus(true);
          } else {
            set({ timeLeft: secondsLeft });
          }
        }
      },
    }),
    {
      name: 'focus-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
