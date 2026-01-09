import createContextHook from "@nkzw/create-context-hook";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Circle,
  Friend,
  ProgressUpdate,
  Challenge,
  Encouragement,
} from "@/types/accountability";
import { useAuth } from "./AuthContext";
import { useHealth } from "./HealthContext";
import { logger } from "@/utils/logger";

const CIRCLES_KEY = "accountability_circles";
const FRIENDS_KEY = "accountability_friends";
const UPDATES_KEY = "accountability_updates";
const CHALLENGES_KEY = "accountability_challenges";
const ENCOURAGEMENTS_KEY = "accountability_encouragements";

export const [AccountabilityProvider, useAccountability] = createContextHook(() => {
  const { user } = useAuth();
  const health = useHealth();
  const queryClient = useQueryClient();
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  const circlesQuery = useQuery({
    queryKey: ["circles", user?.uid],
    queryFn: async (): Promise<Circle[]> => {
      const stored = await AsyncStorage.getItem(CIRCLES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!user?.uid,
  });

  const friendsQuery = useQuery({
    queryKey: ["friends", user?.uid],
    queryFn: async (): Promise<Friend[]> => {
      const stored = await AsyncStorage.getItem(FRIENDS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: !!user?.uid,
  });

  const updatesQuery = useQuery({
    queryKey: ["progressUpdates", selectedCircleId],
    queryFn: async (): Promise<ProgressUpdate[]> => {
      const stored = await AsyncStorage.getItem(UPDATES_KEY);
      const allUpdates: ProgressUpdate[] = stored ? JSON.parse(stored) : [];
      return selectedCircleId
        ? allUpdates.filter((u) => u.circleId === selectedCircleId)
        : allUpdates;
    },
    enabled: !!user?.uid,
  });

  const challengesQuery = useQuery({
    queryKey: ["challenges", selectedCircleId],
    queryFn: async (): Promise<Challenge[]> => {
      const stored = await AsyncStorage.getItem(CHALLENGES_KEY);
      const allChallenges: Challenge[] = stored ? JSON.parse(stored) : [];
      return selectedCircleId
        ? allChallenges.filter((c) => c.circleId === selectedCircleId)
        : allChallenges;
    },
    enabled: !!user?.uid,
  });

  const encouragementsQuery = useQuery({
    queryKey: ["encouragements", user?.uid],
    queryFn: async (): Promise<Encouragement[]> => {
      const stored = await AsyncStorage.getItem(ENCOURAGEMENTS_KEY);
      const all: Encouragement[] = stored ? JSON.parse(stored) : [];
      return all.filter((e) => e.toUserId === user?.uid);
    },
    enabled: !!user?.uid,
  });

  const createCircleMutation = useMutation({
    mutationFn: async (params: {
      name: string;
      description?: string;
      isPrivate: boolean;
    }) => {
      const circles = circlesQuery.data || [];
      const newCircle: Circle = {
        id: `circle_${Date.now()}`,
        name: params.name,
        description: params.description,
        ownerId: user?.uid || "",
        members: [
          {
            userId: user?.uid || "",
            name: user?.email?.split("@")[0] || "You",
            joinedAt: new Date().toISOString(),
            role: "owner",
            stats: {
              currentStreak: 0,
              totalWorkouts: health.exerciseLogs?.length || 0,
              totalCheckIns: health.wellnessCheckIns?.length || 0,
              weeklyGoalProgress: 0,
            },
          },
        ],
        invitedEmails: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          isPrivate: params.isPrivate,
          allowMemberInvites: true,
          shareWorkouts: true,
          shareMeals: true,
          shareCheckIns: true,
        },
      };

      const updated = [...circles, newCircle];
      await AsyncStorage.setItem(CIRCLES_KEY, JSON.stringify(updated));
      logger.info("Circle created", "AccountabilityContext", { circleId: newCircle.id });
      return newCircle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles", user?.uid] });
    },
  });

  const inviteToCircleMutation = useMutation({
    mutationFn: async (params: { circleId: string; email: string }) => {
      const circles = circlesQuery.data || [];
      const circleIndex = circles.findIndex((c) => c.id === params.circleId);
      if (circleIndex === -1) throw new Error("Circle not found");

      const circle = circles[circleIndex];
      if (!circle.invitedEmails.includes(params.email)) {
        circle.invitedEmails.push(params.email);
        circle.updatedAt = new Date().toISOString();
        await AsyncStorage.setItem(CIRCLES_KEY, JSON.stringify(circles));
        logger.info("User invited to circle", "AccountabilityContext", {
          circleId: params.circleId,
          email: params.email,
        });
      }
      return circle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles", user?.uid] });
    },
  });

  const shareProgressMutation = useMutation({
    mutationFn: async (params: {
      circleId: string;
      type: "workout" | "meal" | "checkIn" | "milestone" | "reflection";
      content: string;
      data?: any;
    }) => {
      const stored = await AsyncStorage.getItem(UPDATES_KEY);
      const updates: ProgressUpdate[] = stored ? JSON.parse(stored) : [];

      const newUpdate: ProgressUpdate = {
        id: `update_${Date.now()}`,
        userId: user?.uid || "",
        userName: user?.email?.split("@")[0] || "You",
        circleId: params.circleId,
        type: params.type,
        content: params.content,
        data: params.data,
        timestamp: new Date().toISOString(),
        reactions: [],
        comments: [],
      };

      const updated = [newUpdate, ...updates];
      await AsyncStorage.setItem(UPDATES_KEY, JSON.stringify(updated));
      logger.info("Progress shared", "AccountabilityContext", {
        circleId: params.circleId,
        type: params.type,
      });
      return newUpdate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressUpdates", selectedCircleId] });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async (params: { updateId: string; emoji: string }) => {
      const stored = await AsyncStorage.getItem(UPDATES_KEY);
      const updates: ProgressUpdate[] = stored ? JSON.parse(stored) : [];
      const updateIndex = updates.findIndex((u) => u.id === params.updateId);

      if (updateIndex !== -1) {
        const existingReactionIndex = updates[updateIndex].reactions.findIndex(
          (r) => r.userId === user?.uid
        );

        if (existingReactionIndex !== -1) {
          updates[updateIndex].reactions[existingReactionIndex].emoji = params.emoji;
        } else {
          updates[updateIndex].reactions.push({
            userId: user?.uid || "",
            userName: user?.email?.split("@")[0] || "You",
            emoji: params.emoji,
          });
        }

        await AsyncStorage.setItem(UPDATES_KEY, JSON.stringify(updates));
      }
      return updates[updateIndex];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressUpdates", selectedCircleId] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (params: { updateId: string; text: string }) => {
      const stored = await AsyncStorage.getItem(UPDATES_KEY);
      const updates: ProgressUpdate[] = stored ? JSON.parse(stored) : [];
      const updateIndex = updates.findIndex((u) => u.id === params.updateId);

      if (updateIndex !== -1) {
        updates[updateIndex].comments.push({
          id: `comment_${Date.now()}`,
          userId: user?.uid || "",
          userName: user?.email?.split("@")[0] || "You",
          text: params.text,
          timestamp: new Date().toISOString(),
        });
        await AsyncStorage.setItem(UPDATES_KEY, JSON.stringify(updates));
      }
      return updates[updateIndex];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progressUpdates", selectedCircleId] });
    },
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (params: {
      circleId: string;
      title: string;
      description: string;
      type: "steps" | "workouts" | "checkIns" | "custom";
      goal: number;
      endDate: string;
    }) => {
      const stored = await AsyncStorage.getItem(CHALLENGES_KEY);
      const challenges: Challenge[] = stored ? JSON.parse(stored) : [];

      const newChallenge: Challenge = {
        id: `challenge_${Date.now()}`,
        circleId: params.circleId,
        title: params.title,
        description: params.description,
        type: params.type,
        goal: params.goal,
        startDate: new Date().toISOString(),
        endDate: params.endDate,
        createdBy: user?.uid || "",
        participants: [],
      };

      const updated = [...challenges, newChallenge];
      await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(updated));
      logger.info("Challenge created", "AccountabilityContext", { challengeId: newChallenge.id });
      return newChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges", selectedCircleId] });
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const stored = await AsyncStorage.getItem(CHALLENGES_KEY);
      const challenges: Challenge[] = stored ? JSON.parse(stored) : [];
      const challengeIndex = challenges.findIndex((c) => c.id === challengeId);

      if (challengeIndex !== -1) {
        const alreadyJoined = challenges[challengeIndex].participants.some(
          (p) => p.userId === user?.uid
        );

        if (!alreadyJoined) {
          challenges[challengeIndex].participants.push({
            userId: user?.uid || "",
            userName: user?.email?.split("@")[0] || "You",
            progress: 0,
          });
          await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
        }
      }
      return challenges[challengeIndex];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges", selectedCircleId] });
    },
  });

  const sendEncouragementMutation = useMutation({
    mutationFn: async (params: {
      toUserId: string;
      message: string;
      type: "cheer" | "support" | "advice";
    }) => {
      const stored = await AsyncStorage.getItem(ENCOURAGEMENTS_KEY);
      const encouragements: Encouragement[] = stored ? JSON.parse(stored) : [];

      const newEncouragement: Encouragement = {
        id: `encouragement_${Date.now()}`,
        fromUserId: user?.uid || "",
        fromUserName: user?.email?.split("@")[0] || "You",
        toUserId: params.toUserId,
        message: params.message,
        type: params.type,
        timestamp: new Date().toISOString(),
        read: false,
      };

      const updated = [...encouragements, newEncouragement];
      await AsyncStorage.setItem(ENCOURAGEMENTS_KEY, JSON.stringify(updated));
      logger.info("Encouragement sent", "AccountabilityContext", { toUserId: params.toUserId });
      return newEncouragement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["encouragements"] });
    },
  });

  const leaveCircleMutation = useMutation({
    mutationFn: async (circleId: string) => {
      const circles = circlesQuery.data || [];
      const circleIndex = circles.findIndex((c) => c.id === circleId);

      if (circleIndex !== -1) {
        const circle = circles[circleIndex];
        if (circle.ownerId === user?.uid) {
          circles.splice(circleIndex, 1);
        } else {
          circle.members = circle.members.filter((m) => m.userId !== user?.uid);
        }
        await AsyncStorage.setItem(CIRCLES_KEY, JSON.stringify(circles));
        logger.info("Left circle", "AccountabilityContext", { circleId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["circles", user?.uid] });
      setSelectedCircleId(null);
    },
  });

  const circles = useMemo(() => circlesQuery.data || [], [circlesQuery.data]);
  const friends = useMemo(() => friendsQuery.data || [], [friendsQuery.data]);
  const progressUpdates = useMemo(() => updatesQuery.data || [], [updatesQuery.data]);
  const challenges = useMemo(() => challengesQuery.data || [], [challengesQuery.data]);
  const encouragements = useMemo(
    () => encouragementsQuery.data || [],
    [encouragementsQuery.data]
  );

  const selectedCircle = useMemo(
    () => circles.find((c) => c.id === selectedCircleId) || null,
    [circles, selectedCircleId]
  );

  const unreadEncouragements = useMemo(
    () => encouragements.filter((e) => !e.read).length,
    [encouragements]
  );

  const selectCircle = useCallback((circleId: string | null) => {
    setSelectedCircleId(circleId);
  }, []);

  const createCircle = useCallback(
    (params: { name: string; description?: string; isPrivate: boolean }) => {
      return createCircleMutation.mutateAsync(params);
    },
    [createCircleMutation.mutateAsync]
  );

  const inviteToCircle = useCallback(
    (circleId: string, email: string) => {
      return inviteToCircleMutation.mutateAsync({ circleId, email });
    },
    [inviteToCircleMutation.mutateAsync]
  );

  const shareProgress = useCallback(
    (
      circleId: string,
      type: "workout" | "meal" | "checkIn" | "milestone" | "reflection",
      content: string,
      data?: any
    ) => {
      return shareProgressMutation.mutateAsync({ circleId, type, content, data });
    },
    [shareProgressMutation.mutateAsync]
  );

  const addReaction = useCallback(
    (updateId: string, emoji: string) => {
      return addReactionMutation.mutateAsync({ updateId, emoji });
    },
    [addReactionMutation.mutateAsync]
  );

  const addComment = useCallback(
    (updateId: string, text: string) => {
      return addCommentMutation.mutateAsync({ updateId, text });
    },
    [addCommentMutation.mutateAsync]
  );

  const createChallenge = useCallback(
    (params: {
      circleId: string;
      title: string;
      description: string;
      type: "steps" | "workouts" | "checkIns" | "custom";
      goal: number;
      endDate: string;
    }) => {
      return createChallengeMutation.mutateAsync(params);
    },
    [createChallengeMutation.mutateAsync]
  );

  const joinChallenge = useCallback(
    (challengeId: string) => {
      return joinChallengeMutation.mutateAsync(challengeId);
    },
    [joinChallengeMutation.mutateAsync]
  );

  const sendEncouragement = useCallback(
    (toUserId: string, message: string, type: "cheer" | "support" | "advice") => {
      return sendEncouragementMutation.mutateAsync({ toUserId, message, type });
    },
    [sendEncouragementMutation.mutateAsync]
  );

  const leaveCircle = useCallback(
    (circleId: string) => {
      return leaveCircleMutation.mutateAsync(circleId);
    },
    [leaveCircleMutation.mutateAsync]
  );

  return useMemo(
    () => ({
      circles,
      friends,
      progressUpdates,
      challenges,
      encouragements,
      selectedCircle,
      selectedCircleId,
      unreadEncouragements,
      isLoading:
        circlesQuery.isLoading ||
        friendsQuery.isLoading ||
        updatesQuery.isLoading ||
        challengesQuery.isLoading,
      selectCircle,
      createCircle,
      inviteToCircle,
      shareProgress,
      addReaction,
      addComment,
      createChallenge,
      joinChallenge,
      sendEncouragement,
      leaveCircle,
    }),
    [
      circles,
      friends,
      progressUpdates,
      challenges,
      encouragements,
      selectedCircle,
      selectedCircleId,
      unreadEncouragements,
      circlesQuery.isLoading,
      friendsQuery.isLoading,
      updatesQuery.isLoading,
      challengesQuery.isLoading,
      selectCircle,
      createCircle,
      inviteToCircle,
      shareProgress,
      addReaction,
      addComment,
      createChallenge,
      joinChallenge,
      sendEncouragement,
      leaveCircle,
    ]
  );
});
