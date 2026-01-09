import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthKitPermissions,
} from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';

export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // active calories
  sleep: number; // in minutes
}

const PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
    ],
    write: [],
  },
};

const GOOGLE_FIT_OPTIONS = {
  scopes: [
    Scopes.FITNESS_ACTIVITY_READ,
    Scopes.FITNESS_BODY_READ,
    Scopes.FITNESS_LOCATION_READ,
  ],
};

class HealthSyncService {
  private isInitialized = false;

  async init(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      if (Platform.OS === 'ios') {
        return new Promise((resolve) => {
          AppleHealthKit.initHealthKit(PERMISSIONS, (error: string) => {
            if (error) {
              console.error('[HealthKit] Cannot grant permissions:', error);
              resolve(false);
            } else {
              this.isInitialized = true;
              resolve(true);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        const authResult = await GoogleFit.authorize(GOOGLE_FIT_OPTIONS);
        if (authResult.success) {
          this.isInitialized = true;
          return true;
        } else {
          console.error('[GoogleFit] Authorization failed');
          return false;
        }
      }
    } catch (error) {
      console.error('[HealthSync] Init error:', error);
    }
    return false;
  }

  async getDailyMetrics(date: Date = new Date()): Promise<HealthData> {
    if (!this.isInitialized && Platform.OS !== 'web') {
      const success = await this.init();
      if (!success) {
        return { steps: 0, distance: 0, calories: 0, sleep: 0 };
      }
    }

    if (Platform.OS === 'web') {
      // Mock data for web
      return {
        steps: Math.floor(Math.random() * 10000),
        distance: Math.floor(Math.random() * 5000),
        calories: Math.floor(Math.random() * 500),
        sleep: 420 + Math.floor(Math.random() * 60),
      };
    }

    if (Platform.OS === 'ios') {
      return this.getIOSData(date);
    } else if (Platform.OS === 'android') {
      return this.getAndroidData(date);
    }

    return { steps: 0, distance: 0, calories: 0, sleep: 0 };
  }

  private async getIOSData(date: Date): Promise<HealthData> {
    const options = {
      date: date.toISOString(),
      includeManuallyAdded: true,
    };

    const steps = await new Promise<number>((resolve) => {
      AppleHealthKit.getStepCount(options, (err, results) => {
        resolve(results ? results.value : 0);
      });
    });

    const distance = await new Promise<number>((resolve) => {
      AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
        resolve(results ? results.value : 0);
      });
    });

    const calories = await new Promise<number>((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
        if (results && Array.isArray(results) && results.length > 0) {
          resolve(results[0].value || 0);
        } else {
          resolve(0);
        }
      });
    });

    // Sleep is tricky, usually range based. Getting last night's sleep.
    // Simplifying for this example to return minutes
    const sleep = await new Promise<number>((resolve) => {
        // Need to define start/end date for query
        const endDate = new Date(date);
        endDate.setHours(12, 0, 0, 0);
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(12, 0, 0, 0);

        const sleepOptions = {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };

        AppleHealthKit.getSleepSamples(sleepOptions, (err, results) => {
            if (err || !results) {
                resolve(0);
                return;
            }
            // Sum up duration of sleep samples
            const totalMinutes = results.reduce((acc, sample) => {
                const end = new Date(sample.endDate).getTime();
                const start = new Date(sample.startDate).getTime();
                return acc + (end - start) / (1000 * 60);
            }, 0);
            resolve(totalMinutes);
        });
    });

    return { steps, distance, calories, sleep };
  }

  private async getAndroidData(date: Date): Promise<HealthData> {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const opt = {
      startDate: today.toISOString(),
      endDate: endOfDay.toISOString(),
      bucketUnit: 'DAY' as any,
      bucketInterval: 1,
    };

    try {
      const stepSamples = await GoogleFit.getDailyStepCountSamples(opt);
      const steps = stepSamples.length > 0
        ? stepSamples.filter(s => s.source === 'com.google.android.gms:estimated_steps')[0]?.steps[0]?.value || 0
        : 0;

      const distanceSamples = await GoogleFit.getDailyDistanceSamples(opt);
      const distance = distanceSamples.length > 0 ? distanceSamples[0].distance : 0;

      const calorieSamples = await GoogleFit.getDailyCalorieSamples(opt);
      const calories = calorieSamples.length > 0 ? calorieSamples[0].calorie : 0;

      // Android sleep requires specific permission and call
      // Simplifying to 0 or mock if permissions not granular enough in this scope
      const sleep = 0;

      return { steps, distance, calories, sleep };
    } catch (e) {
      console.error("Google Fit Fetch Error", e);
      return { steps: 0, distance: 0, calories: 0, sleep: 0 };
    }
  }
}

export const healthSyncService = new HealthSyncService();
