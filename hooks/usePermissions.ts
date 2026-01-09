import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useMemo, useCallback } from 'react';
import { logger } from '@/utils/logger';
import type { SubscriptionPlan } from '@/utils/quotas';

export type Permission = 
  | 'read:own_data'
  | 'write:own_data'
  | 'read:all_data'
  | 'write:all_data'
  | 'manage:users'
  | 'manage:subscriptions'
  | 'manage:settings'
  | 'create:workout_plan'
  | 'create:meal_plan'
  | 'create:exercise_log'
  | 'create:meal_log'
  | 'create:wellness_checkin'
  | 'use:ai_coach';

interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'read:own_data',
    'write:own_data',
    'read:all_data',
    'write:all_data',
    'manage:users',
    'manage:subscriptions',
    'manage:settings',
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
  user: [
    'read:own_data',
    'write:own_data',
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
  guest: [
    'read:own_data',
  ],
};

const PLAN_PERMISSIONS: Record<SubscriptionPlan, Permission[]> = {
  free: [
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
  basic: [
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
  pro: [
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
  premium: [
    'create:workout_plan',
    'create:meal_plan',
    'create:exercise_log',
    'create:meal_log',
    'create:wellness_checkin',
    'use:ai_coach',
  ],
};

export function usePermissions() {
  const { user, userClaims, isAdmin: isAdminUser } = useAuth();
  const { currentPlan, quotaUsage, quotaLimits } = useSubscription();

  const userRole = useMemo(() => {
    return userClaims?.role || 'user';
  }, [userClaims]);

  const rolePermissions = useMemo(() => {
    return ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.user;
  }, [userRole]);

  const planPermissions = useMemo(() => {
    return PLAN_PERMISSIONS[currentPlan] || PLAN_PERMISSIONS.free;
  }, [currentPlan]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) {
        logger.debug('Permission denied: User not authenticated', 'Permissions', { permission });
        return false;
      }

      const hasRolePermission = rolePermissions.includes(permission);
      const hasPlanPermission = planPermissions.includes(permission);

      const allowed = hasRolePermission && hasPlanPermission;

      logger.debug(
        `Permission check: ${permission} = ${allowed}`,
        'Permissions',
        { permission, role: userRole, plan: currentPlan, hasRolePermission, hasPlanPermission }
      );

      return allowed;
    },
    [user, rolePermissions, planPermissions, userRole, currentPlan]
  );

  const checkQuotaPermission = useCallback(
    (action: 'workout_plan' | 'meal_plan' | 'ai_message' | 'exercise_log' | 'meal_log' | 'wellness_checkin'): PermissionCheck => {
      if (!user) {
        return { allowed: false, reason: 'Non authentifié' };
      }

      if (isAdminUser) {
        return { allowed: true };
      }

      if (!quotaUsage || !quotaLimits) {
        return { allowed: false, reason: 'Impossible de vérifier les quotas' };
      }

      const quotaMap = {
        workout_plan: {
          usage: quotaUsage.workoutPlansThisMonth,
          limit: quotaLimits.workoutPlansPerMonth,
          name: 'plans d\'entraînement',
        },
        meal_plan: {
          usage: quotaUsage.mealPlansThisMonth,
          limit: quotaLimits.mealPlansPerMonth,
          name: 'plans de repas',
        },
        ai_message: {
          usage: quotaUsage.aiCoachMessagesToday,
          limit: quotaLimits.aiCoachMessagesPerDay,
          name: 'messages AI coach',
        },
        exercise_log: {
          usage: quotaUsage.exerciseLogsToday,
          limit: quotaLimits.exerciseLogsPerDay,
          name: 'logs d\'exercice',
        },
        meal_log: {
          usage: quotaUsage.mealLogsToday,
          limit: quotaLimits.mealLogsPerDay,
          name: 'logs de repas',
        },
        wellness_checkin: {
          usage: quotaUsage.wellnessCheckInsToday,
          limit: quotaLimits.wellnessCheckInsPerDay,
          name: 'check-ins wellness',
        },
      };

      const quota = quotaMap[action];

      if (quota.limit === -1) {
        return { allowed: true };
      }

      if (quota.usage >= quota.limit) {
        return {
          allowed: false,
          reason: `Quota dépassé pour ${quota.name}: ${quota.usage}/${quota.limit}`,
        };
      }

      return { allowed: true };
    },
    [user, isAdminUser, quotaUsage, quotaLimits]
  );

  const canAccessOwnData = useMemo(
    () => hasPermission('read:own_data'),
    [hasPermission]
  );

  const canModifyOwnData = useMemo(
    () => hasPermission('write:own_data'),
    [hasPermission]
  );

  const canAccessAllData = useMemo(
    () => hasPermission('read:all_data'),
    [hasPermission]
  );

  const canModifyAllData = useMemo(
    () => hasPermission('write:all_data'),
    [hasPermission]
  );

  const canManageUsers = useMemo(
    () => hasPermission('manage:users'),
    [hasPermission]
  );

  const canManageSubscriptions = useMemo(
    () => hasPermission('manage:subscriptions'),
    [hasPermission]
  );

  const isAdmin = useMemo(
    () => isAdminUser || userRole === 'admin',
    [isAdminUser, userRole]
  );

  return {
    hasPermission,
    checkQuotaPermission,
    canAccessOwnData,
    canModifyOwnData,
    canAccessAllData,
    canModifyAllData,
    canManageUsers,
    canManageSubscriptions,
    isAdmin,
    userRole,
    currentPlan,
  };
}
