import createContextHook from "@nkzw/create-context-hook";
import { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UnitSystem = "metric" | "imperial";
export type Language = "en" | "es" | "fr" | "de";

export interface AppSettings {
  unitSystem: UnitSystem;
  isDarkMode: boolean;
  language: Language;
}

const DEFAULT_SETTINGS: AppSettings = {
  unitSystem: "metric",
  isDarkMode: false,
  language: "en",
};

const STORAGE_KEY = "app_settings";

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
          console.log("[Settings] Loaded from storage:", parsed);
        }
      } catch (error) {
        console.error("[Settings] Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      console.log("[Settings] Updated:", newSettings);
    } catch (error) {
      console.error("[Settings] Failed to save settings:", error);
      throw error;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    try {
      setSettings(DEFAULT_SETTINGS);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      console.log("[Settings] Reset to defaults");
    } catch (error) {
      console.error("[Settings] Failed to reset settings:", error);
      throw error;
    }
  }, []);

  const convertWeight = useCallback((kg: number): number => {
    return settings.unitSystem === "imperial" ? kg * 2.20462 : kg;
  }, [settings.unitSystem]);

  const convertHeight = useCallback((cm: number): number => {
    return settings.unitSystem === "imperial" ? cm * 0.393701 : cm;
  }, [settings.unitSystem]);

  const getWeightUnit = useCallback((): string => {
    return settings.unitSystem === "imperial" ? "lb" : "kg";
  }, [settings.unitSystem]);

  const getHeightUnit = useCallback((): string => {
    return settings.unitSystem === "imperial" ? "in" : "cm";
  }, [settings.unitSystem]);

  const getDistanceUnit = useCallback((): string => {
    return settings.unitSystem === "imperial" ? "mi" : "km";
  }, [settings.unitSystem]);

  return useMemo(
    () => ({
      settings,
      isLoading,
      updateSettings,
      resetSettings,
      convertWeight,
      convertHeight,
      getWeightUnit,
      getHeightUnit,
      getDistanceUnit,
    }),
    [
      settings,
      isLoading,
      updateSettings,
      resetSettings,
      convertWeight,
      convertHeight,
      getWeightUnit,
      getHeightUnit,
      getDistanceUnit,
    ]
  );
});
