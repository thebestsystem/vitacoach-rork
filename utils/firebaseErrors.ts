import { FirebaseError } from 'firebase/app';
import { logger } from '@/utils/logger';

export type FirebaseErrorCode = 
  | 'permission-denied'
  | 'not-found'
  | 'already-exists'
  | 'resource-exhausted'
  | 'failed-precondition'
  | 'aborted'
  | 'out-of-range'
  | 'unimplemented'
  | 'internal'
  | 'unavailable'
  | 'data-loss'
  | 'unauthenticated'
  | 'invalid-argument'
  | 'deadline-exceeded'
  | 'cancelled';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  canRetry: boolean;
  isRecoverable: boolean;
}

const ERROR_MESSAGES: Record<FirebaseErrorCode, UserFriendlyError> = {
  'permission-denied': {
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    action: 'Vérifiez que vous êtes bien connecté ou contactez le support.',
    canRetry: false,
    isRecoverable: false,
  },
  'not-found': {
    title: 'Données introuvables',
    message: 'Les données demandées n\'existent pas ou ont été supprimées.',
    action: 'Actualisez la page ou réessayez plus tard.',
    canRetry: true,
    isRecoverable: true,
  },
  'already-exists': {
    title: 'Données existantes',
    message: 'Ces données existent déjà dans le système.',
    action: 'Vérifiez vos informations ou utilisez une autre valeur.',
    canRetry: false,
    isRecoverable: true,
  },
  'resource-exhausted': {
    title: 'Quota dépassé',
    message: 'Vous avez atteint la limite de votre abonnement.',
    action: 'Passez à un plan supérieur ou attendez le renouvellement.',
    canRetry: false,
    isRecoverable: true,
  },
  'failed-precondition': {
    title: 'Opération impossible',
    message: 'Les conditions nécessaires pour cette opération ne sont pas remplies.',
    action: 'Vérifiez vos données et réessayez.',
    canRetry: false,
    isRecoverable: true,
  },
  'aborted': {
    title: 'Opération annulée',
    message: 'L\'opération a été annulée en raison d\'un conflit.',
    action: 'Réessayez dans quelques instants.',
    canRetry: true,
    isRecoverable: true,
  },
  'out-of-range': {
    title: 'Valeur invalide',
    message: 'Une valeur fournie est en dehors des limites acceptées.',
    action: 'Vérifiez vos données et réessayez.',
    canRetry: false,
    isRecoverable: true,
  },
  'unimplemented': {
    title: 'Fonctionnalité indisponible',
    message: 'Cette fonctionnalité n\'est pas encore disponible.',
    action: 'Contactez le support pour plus d\'informations.',
    canRetry: false,
    isRecoverable: false,
  },
  'internal': {
    title: 'Erreur interne',
    message: 'Une erreur inattendue s\'est produite.',
    action: 'Réessayez ou contactez le support si le problème persiste.',
    canRetry: true,
    isRecoverable: true,
  },
  'unavailable': {
    title: 'Service indisponible',
    message: 'Le service est temporairement indisponible.',
    action: 'Vérifiez votre connexion internet et réessayez.',
    canRetry: true,
    isRecoverable: true,
  },
  'data-loss': {
    title: 'Perte de données',
    message: 'Des données ont été perdues ou corrompues.',
    action: 'Contactez immédiatement le support.',
    canRetry: false,
    isRecoverable: false,
  },
  'unauthenticated': {
    title: 'Non authentifié',
    message: 'Vous devez être connecté pour effectuer cette action.',
    action: 'Connectez-vous et réessayez.',
    canRetry: false,
    isRecoverable: true,
  },
  'invalid-argument': {
    title: 'Données invalides',
    message: 'Les données fournies sont invalides ou incomplètes.',
    action: 'Vérifiez vos informations et corrigez les erreurs.',
    canRetry: false,
    isRecoverable: true,
  },
  'deadline-exceeded': {
    title: 'Temps écoulé',
    message: 'L\'opération a pris trop de temps.',
    action: 'Vérifiez votre connexion et réessayez.',
    canRetry: true,
    isRecoverable: true,
  },
  'cancelled': {
    title: 'Opération annulée',
    message: 'L\'opération a été annulée.',
    action: 'Réessayez si nécessaire.',
    canRetry: true,
    isRecoverable: true,
  },
};

export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'name' in error &&
    (error as any).name === 'FirebaseError'
  );
}

export function getFirebaseErrorCode(error: unknown): FirebaseErrorCode | null {
  if (!isFirebaseError(error)) return null;
  
  const code = error.code.replace('firestore/', '').replace('auth/', '').replace('storage/', '');
  return code as FirebaseErrorCode;
}

export function getUserFriendlyError(error: unknown): UserFriendlyError {
  if (!isFirebaseError(error)) {
    logger.warn('Non-Firebase error encountered', 'FirebaseErrors', { error });
    return {
      title: 'Erreur',
      message: error instanceof Error ? error.message : 'Une erreur inattendue s\'est produite.',
      action: 'Réessayez ou contactez le support.',
      canRetry: true,
      isRecoverable: true,
    };
  }

  const code = getFirebaseErrorCode(error);
  
  if (code && ERROR_MESSAGES[code]) {
    logger.error(`Firebase error: ${code}`, error, 'FirebaseErrors', { code });
    return ERROR_MESSAGES[code];
  }

  logger.error('Unknown Firebase error code', error, 'FirebaseErrors', { code: error.code });
  return {
    title: 'Erreur',
    message: 'Une erreur s\'est produite lors de l\'opération.',
    action: 'Réessayez ou contactez le support.',
    canRetry: true,
    isRecoverable: true,
  };
}

export function handleFirebaseError(
  error: unknown,
  context: string,
  metadata?: Record<string, any>
): UserFriendlyError {
  const friendlyError = getUserFriendlyError(error);
  
  logger.error(
    `Firebase error in ${context}: ${friendlyError.title}`,
    error instanceof Error ? error : new Error(String(error)),
    'FirebaseErrors',
    { ...metadata, context }
  );
  
  return friendlyError;
}

export function isPermissionDeniedError(error: unknown): boolean {
  return isFirebaseError(error) && getFirebaseErrorCode(error) === 'permission-denied';
}

export function isQuotaExceededError(error: unknown): boolean {
  return isFirebaseError(error) && getFirebaseErrorCode(error) === 'resource-exhausted';
}

export function isNetworkError(error: unknown): boolean {
  return isFirebaseError(error) && getFirebaseErrorCode(error) === 'unavailable';
}

export function isAuthenticationError(error: unknown): boolean {
  return isFirebaseError(error) && getFirebaseErrorCode(error) === 'unauthenticated';
}

export function shouldRetry(error: unknown): boolean {
  const friendlyError = getUserFriendlyError(error);
  return friendlyError.canRetry;
}

export function isRecoverable(error: unknown): boolean {
  const friendlyError = getUserFriendlyError(error);
  return friendlyError.isRecoverable;
}
