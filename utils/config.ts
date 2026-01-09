import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { logger } from "@/utils/logger";
import { SubscriptionPlan, QuotaLimits } from "@/types/subscription";
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GlobalConfig {
  quotas: Record<SubscriptionPlan, QuotaLimits>;
  features: {
    enableNewUI: boolean;
    maintenanceMode: boolean;
  };
  pricing: {
    currency: string;
    plans: Record<SubscriptionPlan, { price: number }>;
  };
}

export const DEFAULT_CONFIG: GlobalConfig = {
  quotas: {
    free: {
      workoutPlansPerMonth: 3,
      mealPlansPerMonth: 3,
      aiCoachMessagesPerDay: 5,
      exerciseLogsPerDay: 5,
      mealLogsPerDay: 5,
      wellnessCheckInsPerDay: 1,
      storageLimit: 50 * 1024 * 1024,
      dataExportEnabled: false,
      advancedAnalytics: false,
      prioritySupport: false,
    },
    basic: {
      workoutPlansPerMonth: 10,
      mealPlansPerMonth: 10,
      aiCoachMessagesPerDay: 20,
      exerciseLogsPerDay: 20,
      mealLogsPerDay: 20,
      wellnessCheckInsPerDay: 3,
      storageLimit: 200 * 1024 * 1024,
      dataExportEnabled: true,
      advancedAnalytics: false,
      prioritySupport: false,
    },
    pro: {
      workoutPlansPerMonth: 50,
      mealPlansPerMonth: 50,
      aiCoachMessagesPerDay: 100,
      exerciseLogsPerDay: 100,
      mealLogsPerDay: 100,
      wellnessCheckInsPerDay: 10,
      storageLimit: 1024 * 1024 * 1024,
      dataExportEnabled: true,
      advancedAnalytics: true,
      prioritySupport: false,
    },
    premium: {
      workoutPlansPerMonth: -1,
      mealPlansPerMonth: -1,
      aiCoachMessagesPerDay: -1,
      exerciseLogsPerDay: -1,
      mealLogsPerDay: -1,
      wellnessCheckInsPerDay: -1,
      storageLimit: 5 * 1024 * 1024 * 1024,
      dataExportEnabled: true,
      advancedAnalytics: true,
      prioritySupport: true,
    },
  },
  features: {
    enableNewUI: true,
    maintenanceMode: false,
  },
  pricing: {
    currency: "USD",
    plans: {
      free: { price: 0 },
      basic: { price: 9.99 },
      pro: { price: 19.99 },
      premium: { price: 39.99 },
    },
  },
};

let cachedConfig: GlobalConfig | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const STORAGE_KEY = 'global_config_cache';

// Simple deep merge helper without external dependencies
function deepMerge<T>(target: T, source: Partial<T>): T {
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source as T;
    }

    let output: T;
    if (typeof structuredClone === 'function') {
        output = structuredClone(target);
    } else {
        output = JSON.parse(JSON.stringify(target));
    }

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const outputValue = (output as any)[key];
            if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue) && 
                outputValue && typeof outputValue === 'object' && !Array.isArray(outputValue)) {
                 (output as any)[key] = deepMerge(outputValue, sourceValue);
            } else {
                 (output as any)[key] = sourceValue;
            }
        }
    }
    return output;
}

export async function getGlobalConfig(): Promise<GlobalConfig> {
  const now = Date.now();

  // 1. Check Memory Cache
  if (cachedConfig && now - lastFetchTime < CACHE_DURATION) {
    return cachedConfig;
  }

  // 2. Check Disk Cache (AsyncStorage) if memory is empty
  if (!cachedConfig) {
      try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
              const parsed = JSON.parse(stored);
              // If disk cache is fresh enough, use it and update memory cache
              if (now - parsed.timestamp < CACHE_DURATION) {
                  cachedConfig = parsed.data;
                  lastFetchTime = parsed.timestamp;
                  logger.debug("Restored global config from disk cache", "Config");
                  return cachedConfig as GlobalConfig;
              }
              // If stale, we can still use it as a fallback but we proceed to fetch
              cachedConfig = parsed.data;
          }
      } catch {
          logger.warn("Failed to read config from disk", "Config");
      }
  }

  // 3. Fetch from Firestore
  try {
    const configRef = doc(db, "adminSettings", "globalConfig");
    const configDoc = await getDoc(configRef);

    if (configDoc.exists()) {
      const data = configDoc.data() as Partial<GlobalConfig>;
      // Deep merge with default config to ensure all keys exist
      cachedConfig = deepMerge(DEFAULT_CONFIG, data);
      lastFetchTime = now;

      // 4. Update Disk Cache
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          data: cachedConfig,
          timestamp: now
      })).catch(e => logger.warn("Failed to write config to disk", "Config"));

      logger.info("Fetched global config from Firestore", "Config");
    } else {
      // If doc doesn't exist, use defaults but don't crash
      if (!cachedConfig) cachedConfig = DEFAULT_CONFIG;
      logger.warn("Global config not found, using defaults", "Config");
    }
  } catch (error) {
    logger.error("Failed to fetch global config", error as Error, "Config");
    // Fallback to defaults or stale cache
    if (!cachedConfig) cachedConfig = DEFAULT_CONFIG;
  }

  return cachedConfig as GlobalConfig;
}

export function getCachedConfig(): GlobalConfig {
    return cachedConfig || DEFAULT_CONFIG;
}
