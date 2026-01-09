import * as Linking from "expo-linking";
import { router } from "expo-router";

export type DeepLinkRoute =
  | "/home"
  | "/coach"
  | "/plans"
  | "/progress"
  | "/dashboard"
  | "/profile"
  | "/track"
  | "/stats"
  | "/achievements"
  | "/subscription"
  | "/notifications"
  | "/challenges";

export interface NotificationData {
  screen?: DeepLinkRoute;
  achievementId?: string;
  challengeId?: string;
  streakType?: string;
  actionType?: "checkin" | "exercise" | "water" | "meal";
}

export function parseNotificationData(data: any): NotificationData | null {
  try {
    if (!data) return null;

    return {
      screen: data.screen as DeepLinkRoute,
      achievementId: data.achievementId,
      challengeId: data.challengeId,
      streakType: data.streakType,
      actionType: data.actionType,
    };
  } catch (error) {
    console.error("[DeepLinking] Error parsing notification data:", error);
    return null;
  }
}

export function handleNotificationNavigation(data: NotificationData | null) {
  if (!data) return;

  console.log("[DeepLinking] Handling notification navigation:", data);

  if (data.screen) {
    const validRoutes = ["/challenges", "/coach-session", "/plan-recalibration", "/shopping-list", "/workout-live"];
    if (validRoutes.includes(data.screen)) {
      router.push(data.screen as any);
    }
  }

  if (data.achievementId) {
    router.push("/(tabs)/achievements" as any);
  }

  if (data.challengeId) {
    router.push("/challenges");
  }

  if (data.actionType) {
    switch (data.actionType) {
      case "checkin":
        router.push("/home");
        break;
      case "exercise":
        router.push("/track");
        break;
      case "water":
        router.push("/track");
        break;
      case "meal":
        router.push("/track");
        break;
    }
  }
}

export function createNotificationDeepLink(data: NotificationData): string {
  const url = Linking.createURL("/", {
    queryParams: {
      screen: data.screen,
      achievementId: data.achievementId,
      challengeId: data.challengeId,
      streakType: data.streakType,
      actionType: data.actionType,
    },
  });

  console.log("[DeepLinking] Created deep link:", url);
  return url;
}

export async function getInitialNotificationData(): Promise<NotificationData | null> {
  try {
    const initialUrl = await Linking.getInitialURL();
    if (!initialUrl) return null;

    const { queryParams } = Linking.parse(initialUrl);
    return parseNotificationData(queryParams);
  } catch (error) {
    console.error("[DeepLinking] Error getting initial notification data:", error);
    return null;
  }
}
