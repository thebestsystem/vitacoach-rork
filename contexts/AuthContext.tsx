import createContextHook from "@nkzw/create-context-hook";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, db } from "@/config/firebase";
import { checkIfMigrationNeeded, migrateLocalDataToFirebase } from "@/utils/dataMigration";
import { doc, getDoc, setDoc } from "firebase/firestore";

type UserRole = "admin" | "user" | "guest";

interface UserClaims {
  role: UserRole;
  subscriptionPlan: "free" | "basic" | "pro" | "premium";
  subscriptionStatus: "active" | "canceled" | "expired" | "trial";
  trialEndsAt?: string;
}

interface ExtendedUser extends FirebaseUser {
  claims?: UserClaims;
}

function translateAuthError(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    "auth/invalid-email": "Invalid email address format",
    "auth/user-disabled": "This account has been disabled",
    "auth/user-not-found": "No account found with this email",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "An account with this email already exists",
    "auth/weak-password": "Password must be at least 8 characters with uppercase, lowercase, and number",
    "auth/too-many-requests": "Too many failed attempts. Please try again later",
    "auth/network-request-failed": "Network error. Check your connection",
    "auth/operation-not-allowed": "This operation is not allowed",
    "auth/invalid-credential": "Invalid credentials provided",
  };
  return errorMessages[errorCode] || "Authentication failed. Please try again";
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain a lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number" };
  }
  return { valid: true };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationComplete, setMigrationComplete] = useState<boolean>(false);
  const [userClaims, setUserClaims] = useState<UserClaims | null>(null);
  const [lastTokenRefresh, setLastTokenRefresh] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("[Auth] State changed:", currentUser?.uid);
      
      if (currentUser) {
        const defaultClaims: UserClaims = {
          role: "user",
          subscriptionPlan: "free",
          subscriptionStatus: "trial",
        };
        
        setUser({ ...currentUser, claims: defaultClaims } as ExtendedUser);
        setUserClaims(defaultClaims);
        setMigrationComplete(true);
        setLoading(false);
        
        (async () => {
          try {
            const tokenResult = await currentUser.getIdTokenResult(false);
            const claims = tokenResult.claims as any;
            
            const userClaimsData: UserClaims = {
              role: (claims.role as UserRole) || "user",
              subscriptionPlan: claims.subscriptionPlan || "free",
              subscriptionStatus: claims.subscriptionStatus || "trial",
              trialEndsAt: claims.trialEndsAt,
            };
            
            setUserClaims(userClaimsData);
            setUser({ ...currentUser, claims: userClaimsData } as ExtendedUser);
            console.log("[Auth] User claims loaded successfully");
          } catch (err: any) {
            console.warn("[Auth] Could not load user claims (offline?):", err?.code || err?.message);
          }
        })();
        
        (async () => {
          try {
            const userRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              console.log("[Auth] Creating user document");
              await setDoc(userRef, {
                email: currentUser.email,
                createdAt: new Date().toISOString(),
                role: "user",
                subscriptionPlan: "free",
                subscriptionStatus: "trial",
                updatedAt: new Date().toISOString(),
              });
            }
          } catch (err: any) {
            console.warn("[Auth] Could not sync user document (offline?):", err?.code || err?.message);
          }
        })();
        
        (async () => {
          try {
            setIsMigrating(true);
            const needsMigration = await checkIfMigrationNeeded();
            if (needsMigration) {
              console.log("[Auth] Migration needed for user:", currentUser.uid);
              const result = await migrateLocalDataToFirebase(currentUser.uid);
              console.log("[Auth] Migration result:", result);
            }
          } catch (err: any) {
            console.warn("[Auth] Migration check failed (offline?):", err?.code || err?.message);
          } finally {
            setIsMigrating(false);
          }
        })();
      } else {
        setUser(null);
        setUserClaims(null);
        setMigrationComplete(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      if (!validateEmail(email)) {
        const error = new Error("Invalid email address format");
        setError(error.message);
        throw error;
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        const error = new Error(passwordValidation.message || "Invalid password");
        setError(error.message);
        throw error;
      }
      
      console.log("[Auth] Creating new user account");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log("[Auth] User signed up:", result.user.uid);
      
      await sendEmailVerification(result.user);
      console.log("[Auth] Verification email sent");
      
      const userRef = doc(db, "users", result.user.uid);
      await setDoc(userRef, {
        email: result.user.email,
        createdAt: new Date().toISOString(),
        role: "user",
        subscriptionPlan: "free",
        subscriptionStatus: "trial",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      return result.user;
    } catch (err: any) {
      const errorMessage = err.code ? translateAuthError(err.code) : (err.message || "Failed to sign up");
      console.error("[Auth] Sign up error:", err.code || err.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      
      if (!validateEmail(email)) {
        const error = new Error("Invalid email address format");
        setError(error.message);
        throw error;
      }
      
      console.log("[Auth] Signing in user");
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Auth] User signed in:", result.user.uid);
      return result.user;
    } catch (err: any) {
      const errorMessage = err.code ? translateAuthError(err.code) : (err.message || "Failed to sign in");
      console.error("[Auth] Sign in error:", err.code || err.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      console.log("[Auth] Signing out user");
      await firebaseSignOut(auth);
      console.log("[Auth] User signed out successfully");
    } catch (err: any) {
      const errorMessage = err.code ? translateAuthError(err.code) : (err.message || "Failed to sign out");
      console.error("[Auth] Sign out error:", err.code || err.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);
  
  const resetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      
      if (!validateEmail(email)) {
        const error = new Error("Invalid email address format");
        setError(error.message);
        throw error;
      }
      
      console.log("[Auth] Sending password reset email");
      await sendPasswordResetEmail(auth, email);
      console.log("[Auth] Password reset email sent");
    } catch (err: any) {
      const errorMessage = err.code ? translateAuthError(err.code) : (err.message || "Failed to send reset email");
      console.error("[Auth] Reset password error:", err.code || err.message);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);
  
  const refreshUserClaims = useCallback(async () => {
    if (!user) return;
    
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000;
    
    if (now - lastTokenRefresh < cooldownPeriod) {
      console.log("[Auth] Skipping token refresh - cooldown period active");
      return;
    }
    
    try {
      console.log("[Auth] Refreshing user claims");
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn("[Auth] No current user found");
        return;
      }
      
      const tokenResult = await currentUser.getIdTokenResult(true);
      const claims = tokenResult.claims as any;
      
      const userClaimsData: UserClaims = {
        role: (claims.role as UserRole) || "user",
        subscriptionPlan: claims.subscriptionPlan || "free",
        subscriptionStatus: claims.subscriptionStatus || "trial",
        trialEndsAt: claims.trialEndsAt,
      };
      
      setUserClaims(userClaimsData);
      setUser({ ...currentUser, claims: userClaimsData } as ExtendedUser);
      setLastTokenRefresh(now);
      console.log("[Auth] User claims refreshed");
    } catch (err: any) {
      console.error("[Auth] Error refreshing claims:", err);
      if (err?.code === "auth/quota-exceeded") {
        console.warn("[Auth] Token refresh quota exceeded - will retry later");
      }
    }
  }, [user, lastTokenRefresh]);

  return useMemo(
    () => ({
      user,
      loading,
      error,
      isMigrating,
      migrationComplete,
      userClaims,
      signUp,
      signIn,
      signOut,
      resetPassword,
      refreshUserClaims,
      isAuthenticated: !!user,
      isAdmin: userClaims?.role === "admin",
      isPremium: userClaims?.subscriptionPlan === "premium" || userClaims?.subscriptionPlan === "pro",
      isSubscribed: userClaims?.subscriptionStatus === "active",
    }),
    [user, loading, error, isMigrating, migrationComplete, userClaims, signUp, signIn, signOut, resetPassword, refreshUserClaims]
  );
});
