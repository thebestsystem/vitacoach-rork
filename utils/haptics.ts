import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const lightImpact = async () => {
  if (Platform.OS !== "web") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const mediumImpact = async () => {
  if (Platform.OS !== "web") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

export const heavyImpact = async () => {
  if (Platform.OS !== "web") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

export const selectionFeedback = async () => {
  if (Platform.OS !== "web") {
    await Haptics.selectionAsync();
  }
};

export const notificationSuccess = async () => {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

export const notificationWarning = async () => {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

export const notificationError = async () => {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

export const successFeedback = notificationSuccess;
export const errorFeedback = notificationError;
