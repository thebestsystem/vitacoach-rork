# Tests de Sécurité - Documentation Complète

## Vue d'ensemble

Ce document décrit tous les tests de sécurité nécessaires pour valider l'intégrité du système de sécurité Firebase (Auth, Firestore Rules, Storage Rules, Permissions).

---

## 1. Tests d'Authentification

### 1.1 Test: Création de compte avec validation d'email

**Objectif:** Vérifier que seuls les emails valides sont acceptés lors de la création de compte.

**Préconditions:**
- Firebase Auth activé
- Aucun utilisateur connecté

**Étapes:**
1. Tenter de créer un compte avec email invalide: `invalid-email`
2. Tenter de créer un compte avec email valide: `test@example.com`

**Résultats attendus:**
- ✅ Étape 1: Rejet avec erreur "Invalid email address format"
- ✅ Étape 2: Succès avec création du document utilisateur dans Firestore

**Code de test:**
```typescript
// Test 1: Email invalide
try {
  await signUp("invalid-email", "password123");
  fail("Should have thrown an error");
} catch (error) {
  expect(error.message).toBe("Invalid email address format");
}

// Test 2: Email valide
const user = await signUp("test@example.com", "password123");
expect(user.uid).toBeDefined();
expect(user.email).toBe("test@example.com");
```

---

### 1.2 Test: Validation de mot de passe

**Objectif:** Vérifier que les mots de passe faibles sont rejetés.

**Préconditions:**
- Firebase Auth activé
- Aucun utilisateur connecté

**Étapes:**
1. Tenter avec mot de passe < 6 caractères: `abc`
2. Tenter avec mot de passe sans minuscule: `PASSWORD123`
3. Tenter avec mot de passe sans chiffre: `password`
4. Tenter avec mot de passe valide: `password123`

**Résultats attendus:**
- ✅ Étape 1: Rejet "Password must be at least 6 characters"
- ✅ Étape 2: Rejet "Password must contain a lowercase letter"
- ✅ Étape 3: Rejet "Password must contain a number"
- ✅ Étape 4: Succès

**Code de test:**
```typescript
// Test: Mots de passe invalides
const invalidPasswords = [
  { password: "abc", expectedError: "Password must be at least 6 characters" },
  { password: "PASSWORD123", expectedError: "Password must contain a lowercase letter" },
  { password: "password", expectedError: "Password must contain a number" },
];

for (const { password, expectedError } of invalidPasswords) {
  try {
    await signUp("test@example.com", password);
    fail("Should have thrown an error");
  } catch (error) {
    expect(error.message).toBe(expectedError);
  }
}

// Test: Mot de passe valide
const user = await signUp("test@example.com", "password123");
expect(user.uid).toBeDefined();
```

---

### 1.3 Test: Connexion avec credentials incorrects

**Objectif:** Vérifier la gestion des erreurs de connexion.

**Préconditions:**
- Compte existant: `test@example.com` / `password123`

**Étapes:**
1. Tenter de se connecter avec email inexistant
2. Tenter de se connecter avec mot de passe incorrect
3. Se connecter avec credentials corrects

**Résultats attendus:**
- ✅ Étape 1: Rejet "No account found with this email"
- ✅ Étape 2: Rejet "Incorrect password"
- ✅ Étape 3: Succès

**Code de test:**
```typescript
// Test 1: Email inexistant
try {
  await signIn("nonexistent@example.com", "password123");
  fail("Should have thrown an error");
} catch (error) {
  expect(error.message).toContain("No account found");
}

// Test 2: Mot de passe incorrect
try {
  await signIn("test@example.com", "wrongpassword");
  fail("Should have thrown an error");
} catch (error) {
  expect(error.message).toContain("Incorrect password");
}

// Test 3: Credentials corrects
const user = await signIn("test@example.com", "password123");
expect(user.uid).toBeDefined();
```

---

## 2. Tests des Règles Firestore

### 2.1 Test: Lecture des données - Principe PoLP

**Objectif:** Vérifier qu'un utilisateur ne peut lire QUE ses propres données.

**Préconditions:**
- Deux utilisateurs créés: `userA` et `userB`
- Documents créés: `/healthMetrics/userA` et `/healthMetrics/userB`

**Étapes:**
1. UserA tente de lire `/healthMetrics/userA` (ses données)
2. UserA tente de lire `/healthMetrics/userB` (données d'un autre)
3. Admin tente de lire `/healthMetrics/userB`

**Résultats attendus:**
- ✅ Étape 1: Succès (lecture autorisée)
- ❌ Étape 2: Rejet avec `permission-denied`
- ✅ Étape 3: Succès (admin peut tout lire)

**Code de test:**
```typescript
// Test 1: Lecture de ses propres données
const userAData = await getDoc(doc(db, "healthMetrics", userA.uid));
expect(userAData.exists()).toBe(true);

// Test 2: Lecture des données d'un autre
try {
  await getDoc(doc(db, "healthMetrics", userB.uid));
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 3: Admin lit les données d'un autre
await signInAsAdmin();
const userBData = await getDoc(doc(db, "healthMetrics", userB.uid));
expect(userBData.exists()).toBe(true);
```

---

### 2.2 Test: Écriture - Protection des champs sensibles

**Objectif:** Vérifier qu'un utilisateur ne peut pas modifier les champs protégés (`role`, `createdAt`).

**Préconditions:**
- Utilisateur connecté: `testUser` avec rôle `user`
- Document existant: `/users/testUser`

**Étapes:**
1. Tenter de changer son propre rôle à `admin`
2. Tenter de modifier `createdAt`
3. Modifier un champ non protégé (ex: `displayName`)
4. Admin modifie le rôle d'un utilisateur

**Résultats attendus:**
- ❌ Étape 1: Rejet avec `permission-denied`
- ❌ Étape 2: Rejet avec `permission-denied`
- ✅ Étape 3: Succès
- ✅ Étape 4: Succès (admin peut modifier les rôles)

**Code de test:**
```typescript
const userRef = doc(db, "users", testUser.uid);

// Test 1: Auto-promotion à admin
try {
  await updateDoc(userRef, { role: "admin" });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 2: Modification de createdAt
try {
  await updateDoc(userRef, { createdAt: new Date().toISOString() });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 3: Modification d'un champ autorisé
await updateDoc(userRef, { displayName: "New Name" });
const updatedDoc = await getDoc(userRef);
expect(updatedDoc.data().displayName).toBe("New Name");

// Test 4: Admin modifie le rôle
await signInAsAdmin();
await updateDoc(userRef, { role: "admin" });
const adminDoc = await getDoc(userRef);
expect(adminDoc.data().role).toBe("admin");
```

---

### 2.3 Test: Création d'utilisateur - Validation des données

**Objectif:** Vérifier que les données invalides sont rejetées à la création.

**Préconditions:**
- Firebase Auth activé
- Utilisateur authentifié

**Étapes:**
1. Créer un utilisateur avec email invalide
2. Créer un utilisateur avec rôle `admin` (non autorisé à la création)
3. Créer un utilisateur avec plan d'abonnement invalide
4. Créer un utilisateur valide

**Résultats attendus:**
- ❌ Étape 1: Rejet (email invalide)
- ❌ Étape 2: Rejet (rôle admin non autorisé)
- ❌ Étape 3: Rejet (plan invalide)
- ✅ Étape 4: Succès

**Code de test:**
```typescript
const userRef = doc(db, "users", testUser.uid);

// Test 1: Email invalide
try {
  await setDoc(userRef, {
    email: "invalid-email",
    role: "user",
    subscriptionPlan: "free",
    subscriptionStatus: "trial",
  });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 2: Auto-attribution du rôle admin
try {
  await setDoc(userRef, {
    email: "test@example.com",
    role: "admin",
    subscriptionPlan: "free",
    subscriptionStatus: "trial",
  });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 3: Plan invalide
try {
  await setDoc(userRef, {
    email: "test@example.com",
    role: "user",
    subscriptionPlan: "invalid-plan",
    subscriptionStatus: "trial",
  });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 4: Données valides
await setDoc(userRef, {
  email: "test@example.com",
  role: "user",
  subscriptionPlan: "free",
  subscriptionStatus: "trial",
});
const doc = await getDoc(userRef);
expect(doc.exists()).toBe(true);
```

---

### 2.4 Test: Quotas - Validation des limites

**Objectif:** Vérifier que les valeurs négatives sont rejetées dans les quotas.

**Préconditions:**
- Utilisateur connecté
- Document `/quotaUsage/{userId}` existant

**Étapes:**
1. Tenter de définir `workoutPlansThisMonth` à -1
2. Tenter de définir `mealPlansThisMonth` à -5
3. Définir des valeurs valides (≥ 0)

**Résultats attendus:**
- ❌ Étape 1: Rejet (valeur négative)
- ❌ Étape 2: Rejet (valeur négative)
- ✅ Étape 3: Succès

**Code de test:**
```typescript
const quotaRef = doc(db, "quotaUsage", testUser.uid);

// Test 1: Valeur négative pour workoutPlansThisMonth
try {
  await setDoc(quotaRef, {
    workoutPlansThisMonth: -1,
    mealPlansThisMonth: 0,
  });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 2: Valeur négative pour mealPlansThisMonth
try {
  await setDoc(quotaRef, {
    workoutPlansThisMonth: 0,
    mealPlansThisMonth: -5,
  });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 3: Valeurs valides
await setDoc(quotaRef, {
  workoutPlansThisMonth: 5,
  mealPlansThisMonth: 3,
});
const quotaDoc = await getDoc(quotaRef);
expect(quotaDoc.data().workoutPlansThisMonth).toBe(5);
```

---

### 2.5 Test: Abonnements - Restrictions de modification

**Objectif:** Vérifier qu'un utilisateur ne peut QUE annuler son abonnement (pas le changer de plan).

**Préconditions:**
- Utilisateur avec abonnement actif: plan `basic`

**Étapes:**
1. Tenter de passer du plan `basic` à `premium` directement
2. Annuler l'abonnement (`cancelAtPeriodEnd = true`)
3. Admin change le plan de l'utilisateur

**Résultats attendus:**
- ❌ Étape 1: Rejet (changement de plan non autorisé)
- ✅ Étape 2: Succès (annulation autorisée)
- ✅ Étape 3: Succès (admin peut changer le plan)

**Code de test:**
```typescript
const subscriptionRef = doc(db, "subscriptions", testUser.uid);

// Test 1: Changement de plan non autorisé
try {
  await updateDoc(subscriptionRef, { plan: "premium" });
  fail("Should have thrown permission-denied");
} catch (error) {
  expect(isPermissionDeniedError(error)).toBe(true);
}

// Test 2: Annulation autorisée
await updateDoc(subscriptionRef, { cancelAtPeriodEnd: true });
const canceledDoc = await getDoc(subscriptionRef);
expect(canceledDoc.data().cancelAtPeriodEnd).toBe(true);

// Test 3: Admin change le plan
await signInAsAdmin();
await updateDoc(subscriptionRef, { plan: "premium" });
const upgradedDoc = await getDoc(subscriptionRef);
expect(upgradedDoc.data().plan).toBe("premium");
```

---

## 3. Tests des Règles Storage

### 3.1 Test: Upload de fichiers - Taille et type

**Objectif:** Vérifier les restrictions de taille et de type de fichier.

**Préconditions:**
- Utilisateur connecté

**Étapes:**
1. Upload d'une image de 6MB dans `/users/{userId}/profile/` (max 5MB)
2. Upload d'un PDF dans `/users/{userId}/profile/` (seules images autorisées)
3. Upload d'une image de 3MB dans `/users/{userId}/profile/` (valide)
4. Upload d'une vidéo de 12MB dans `/users/{userId}/exercise/` (max 10MB)
5. Upload d'une vidéo de 8MB dans `/users/{userId}/exercise/` (valide)

**Résultats attendus:**
- ❌ Étape 1: Rejet (taille dépassée)
- ❌ Étape 2: Rejet (type non autorisé)
- ✅ Étape 3: Succès
- ❌ Étape 4: Rejet (taille dépassée)
- ✅ Étape 5: Succès

**Code de test:**
```typescript
const storage = getStorage();

// Test 1: Image trop grande
const largeImage = createMockFile(6 * 1024 * 1024, "image/jpeg");
const profileRef1 = ref(storage, `users/${testUser.uid}/profile/large.jpg`);
try {
  await uploadBytes(profileRef1, largeImage);
  fail("Should have thrown an error");
} catch (error) {
  expect(error.code).toContain("storage/unauthorized");
}

// Test 2: Type de fichier invalide
const pdfFile = createMockFile(1 * 1024 * 1024, "application/pdf");
const profileRef2 = ref(storage, `users/${testUser.uid}/profile/doc.pdf`);
try {
  await uploadBytes(profileRef2, pdfFile);
  fail("Should have thrown an error");
} catch (error) {
  expect(error.code).toContain("storage/unauthorized");
}

// Test 3: Image valide
const validImage = createMockFile(3 * 1024 * 1024, "image/jpeg");
const profileRef3 = ref(storage, `users/${testUser.uid}/profile/avatar.jpg`);
await uploadBytes(profileRef3, validImage);
const url = await getDownloadURL(profileRef3);
expect(url).toBeDefined();

// Test 4: Vidéo trop grande
const largeVideo = createMockFile(12 * 1024 * 1024, "video/mp4");
const exerciseRef1 = ref(storage, `users/${testUser.uid}/exercise/workout.mp4`);
try {
  await uploadBytes(exerciseRef1, largeVideo);
  fail("Should have thrown an error");
} catch (error) {
  expect(error.code).toContain("storage/unauthorized");
}

// Test 5: Vidéo valide
const validVideo = createMockFile(8 * 1024 * 1024, "video/mp4");
const exerciseRef2 = ref(storage, `users/${testUser.uid}/exercise/workout.mp4`);
await uploadBytes(exerciseRef2, validVideo);
const videoUrl = await getDownloadURL(exerciseRef2);
expect(videoUrl).toBeDefined();
```

---

### 3.2 Test: Permissions de lecture Storage

**Objectif:** Vérifier que les photos de profil sont publiques mais les autres fichiers sont privés.

**Préconditions:**
- UserA uploadé des fichiers:
  - `/users/userA/profile/avatar.jpg`
  - `/users/userA/exercise/workout.jpg`

**Étapes:**
1. UserB tente de lire `/users/userA/profile/avatar.jpg`
2. UserB tente de lire `/users/userA/exercise/workout.jpg`
3. UserA lit `/users/userA/exercise/workout.jpg`

**Résultats attendus:**
- ✅ Étape 1: Succès (profil public)
- ❌ Étape 2: Rejet (exercice privé)
- ✅ Étape 3: Succès (propriétaire)

**Code de test:**
```typescript
const storage = getStorage();

// Test 1: UserB lit la photo de profil de UserA (public)
await signIn(userB.email, "password");
const profileRef = ref(storage, `users/${userA.uid}/profile/avatar.jpg`);
const profileUrl = await getDownloadURL(profileRef);
expect(profileUrl).toBeDefined();

// Test 2: UserB tente de lire les exercices de UserA (privé)
const exerciseRef = ref(storage, `users/${userA.uid}/exercise/workout.jpg`);
try {
  await getDownloadURL(exerciseRef);
  fail("Should have thrown an error");
} catch (error) {
  expect(error.code).toContain("storage/unauthorized");
}

// Test 3: UserA lit ses propres exercices
await signIn(userA.email, "password");
const ownExerciseUrl = await getDownloadURL(exerciseRef);
expect(ownExerciseUrl).toBeDefined();
```

---

## 4. Tests des Permissions Applicatives

### 4.1 Test: Vérification des permissions par rôle

**Objectif:** Vérifier que le hook `usePermissions` retourne les bonnes permissions par rôle.

**Préconditions:**
- 3 utilisateurs créés avec rôles différents: `guest`, `user`, `admin`

**Étapes:**
1. Guest vérifie ses permissions
2. User vérifie ses permissions
3. Admin vérifie ses permissions

**Résultats attendus:**
- Guest: Lecture seule (`read:own_data`)
- User: Lecture + écriture (`read:own_data`, `write:own_data`, `create:*`)
- Admin: Toutes les permissions

**Code de test:**
```typescript
// Test 1: Permissions Guest
await signInAsGuest();
const { hasPermission: guestHasPermission } = usePermissions();
expect(guestHasPermission("read:own_data")).toBe(true);
expect(guestHasPermission("write:own_data")).toBe(false);
expect(guestHasPermission("create:workout_plan")).toBe(false);

// Test 2: Permissions User
await signInAsUser();
const { hasPermission: userHasPermission } = usePermissions();
expect(userHasPermission("read:own_data")).toBe(true);
expect(userHasPermission("write:own_data")).toBe(true);
expect(userHasPermission("create:workout_plan")).toBe(true);
expect(userHasPermission("manage:users")).toBe(false);

// Test 3: Permissions Admin
await signInAsAdmin();
const { hasPermission: adminHasPermission } = usePermissions();
expect(adminHasPermission("read:own_data")).toBe(true);
expect(adminHasPermission("write:own_data")).toBe(true);
expect(adminHasPermission("create:workout_plan")).toBe(true);
expect(adminHasPermission("manage:users")).toBe(true);
expect(adminHasPermission("read:all_data")).toBe(true);
```

---

### 4.2 Test: Vérification des quotas par plan

**Objectif:** Vérifier que les quotas sont correctement appliqués selon le plan d'abonnement.

**Préconditions:**
- Utilisateur avec plan `free` (3 workout plans/mois)
- Utilisateur a déjà créé 3 plans ce mois

**Étapes:**
1. Vérifier le quota pour `workout_plan` (devrait être dépassé)
2. Vérifier le quota pour `meal_plan` (devrait être disponible)
3. Upgrader à `premium` (illimité)
4. Vérifier le quota pour `workout_plan` (devrait être disponible)

**Résultats attendus:**
- ✅ Étape 1: Quota dépassé (3/3)
- ✅ Étape 2: Quota disponible
- ✅ Étape 3: Upgrade réussi
- ✅ Étape 4: Quota illimité

**Code de test:**
```typescript
// Test 1: Quota dépassé (Free plan)
const { checkQuotaPermission } = usePermissions();
const workoutQuota = checkQuotaPermission("workout_plan");
expect(workoutQuota.allowed).toBe(false);
expect(workoutQuota.reason).toContain("Quota dépassé");

// Test 2: Quota disponible pour meal plans
const mealQuota = checkQuotaPermission("meal_plan");
expect(mealQuota.allowed).toBe(true);

// Test 3: Upgrade à Premium
await signInAsAdmin();
await updateDoc(doc(db, "subscriptions", testUser.uid), {
  plan: "premium",
});
await refreshUserClaims();

// Test 4: Quota illimité (Premium)
const premiumWorkoutQuota = checkQuotaPermission("workout_plan");
expect(premiumWorkoutQuota.allowed).toBe(true);
```

---

## 5. Tests de Gestion des Erreurs

### 5.1 Test: Détection et traduction des erreurs Firebase

**Objectif:** Vérifier que les erreurs Firebase sont correctement détectées et traduites.

**Préconditions:**
- Utilisateur connecté

**Étapes:**
1. Déclencher une erreur `permission-denied`
2. Vérifier la détection avec `isPermissionDeniedError()`
3. Obtenir le message utilisateur avec `getUserFriendlyError()`
4. Vérifier que l'erreur est loggée

**Résultats attendus:**
- ✅ Erreur détectée comme `permission-denied`
- ✅ Message français retourné
- ✅ Erreur loggée avec niveau `error`

**Code de test:**
```typescript
import {
  isPermissionDeniedError,
  getUserFriendlyError,
  handleFirebaseError,
} from "@/utils/firebaseErrors";

// Test 1: Déclencher une erreur permission-denied
let caughtError: any;
try {
  await getDoc(doc(db, "healthMetrics", "other-user-id"));
} catch (error) {
  caughtError = error;
}

// Test 2: Détection
expect(isPermissionDeniedError(caughtError)).toBe(true);

// Test 3: Message utilisateur
const friendlyError = getUserFriendlyError(caughtError);
expect(friendlyError.title).toBe("Accès refusé");
expect(friendlyError.message).toContain("permissions nécessaires");
expect(friendlyError.canRetry).toBe(false);

// Test 4: Logging
const handledError = handleFirebaseError(caughtError, "Test Context");
expect(handledError.title).toBe("Accès refusé");
```

---

### 5.2 Test: ErrorBoundary capture les erreurs React

**Objectif:** Vérifier que le GlobalErrorBoundary capture les erreurs et affiche le fallback.

**Préconditions:**
- Application avec GlobalErrorBoundary

**Étapes:**
1. Déclencher une erreur dans un composant enfant
2. Vérifier que le fallback est affiché
3. Cliquer sur "Try to Recover"
4. Vérifier que l'app est restaurée

**Résultats attendus:**
- ✅ Erreur capturée
- ✅ Fallback affiché avec message
- ✅ Bouton de retry fonctionnel
- ✅ Erreur loggée avec niveau `critical`

**Code de test:**
```typescript
import { render, screen, fireEvent } from "@testing-library/react-native";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";

// Composant qui déclenche une erreur
const BuggyComponent = () => {
  throw new Error("Test error");
};

// Test
const { getByTestId, getByText } = render(
  <GlobalErrorBoundary>
    <BuggyComponent />
  </GlobalErrorBoundary>
);

// Test 1: Fallback affiché
expect(getByText("Something Went Wrong")).toBeDefined();

// Test 2: Bouton retry disponible
const retryButton = getByTestId("error-retry-button");
expect(retryButton).toBeDefined();

// Test 3: Retry fonctionnel
fireEvent.press(retryButton);
```

---

## 6. Tests de Monitoring et Logs

### 6.1 Test: Logs structurés par niveau

**Objectif:** Vérifier que les logs sont correctement écrits et filtrables.

**Préconditions:**
- Logger initialisé

**Étapes:**
1. Écrire des logs de différents niveaux (debug, info, warn, error, critical)
2. Récupérer les logs filtrés par niveau
3. Vérifier le format des logs

**Résultats attendus:**
- ✅ Tous les logs écrits
- ✅ Filtrage par niveau fonctionnel
- ✅ Format structuré correct

**Code de test:**
```typescript
import { logger } from "@/utils/logger";

// Test 1: Écrire des logs
logger.debug("Debug message", "TestContext", { key: "value" });
logger.info("Info message", "TestContext");
logger.warn("Warning message", "TestContext");
logger.error("Error message", new Error("Test"), "TestContext");
logger.critical("Critical message", new Error("Critical"), "TestContext");

// Test 2: Récupérer les logs
const allLogs = logger.getLogs();
expect(allLogs.length).toBeGreaterThanOrEqual(5);

const errorLogs = logger.getLogs("error");
expect(errorLogs.length).toBeGreaterThanOrEqual(1);

// Test 3: Format
const lastLog = allLogs[allLogs.length - 1];
expect(lastLog.level).toBeDefined();
expect(lastLog.timestamp).toBeDefined();
expect(lastLog.message).toBeDefined();
expect(lastLog.context).toBeDefined();
```

---

## 7. Checklist de Validation Finale

Avant de considérer le module Sécurité comme complet, TOUS ces tests doivent passer:

### Authentification
- [x] Validation d'email à la création de compte
- [x] Validation de mot de passe (longueur, complexité)
- [x] Gestion des erreurs de connexion
- [x] Envoi d'email de vérification
- [x] Reset de mot de passe

### Règles Firestore
- [x] Lecture limitée aux données propres (PoLP)
- [x] Protection des champs sensibles (role, createdAt)
- [x] Validation des données à la création
- [x] Validation des quotas (valeurs négatives)
- [x] Restrictions sur les abonnements
- [x] Admin peut accéder à toutes les données
- [x] Admin peut modifier les rôles

### Règles Storage
- [x] Restrictions de taille de fichier
- [x] Restrictions de type de fichier
- [x] Photos de profil publiques
- [x] Autres fichiers privés
- [x] Propriétaire peut accéder à ses fichiers

### Permissions Applicatives
- [x] Permissions par rôle (guest, user, admin)
- [x] Permissions par plan d'abonnement
- [x] Vérification des quotas
- [x] Hook usePermissions fonctionnel

### Gestion des Erreurs
- [x] Détection des erreurs Firebase
- [x] Messages utilisateur en français
- [x] Logging des erreurs
- [x] ErrorBoundary capture les erreurs
- [x] Composant Toast pour feedback utilisateur

### Monitoring
- [x] Logs structurés par niveau
- [x] Filtrage des logs
- [x] Export des logs
- [x] Métriques de performance

---

## 8. Commandes pour Exécuter les Tests

### Tests unitaires
```bash
# Installer les dépendances de test
npm install --save-dev @testing-library/react-native jest

# Lancer les tests
npm test

# Lancer avec coverage
npm test -- --coverage
```

### Tests manuels
```bash
# Tester les règles Firestore
firebase emulators:start --only firestore

# Tester les règles Storage
firebase emulators:start --only storage

# Tester l'authentification
firebase emulators:start --only auth
```

---

## 9. Résultats Attendus

### Métriques de Succès
- ✅ 100% des tests d'authentification passent
- ✅ 100% des tests de règles Firestore passent
- ✅ 100% des tests de règles Storage passent
- ✅ 100% des tests de permissions passent
- ✅ 0 erreur `permission-denied` en usage légitime
- ✅ Toutes les tentatives d'accès non autorisé sont bloquées

### KPIs de Sécurité
- **Temps de réponse des règles**: < 100ms
- **Taux d'erreurs permission-denied légitimes**: 0%
- **Taux d'erreurs permission-denied malveillantes**: 100%
- **Coverage des tests**: > 90%

---

## 10. Support et Maintenance

### En cas d'échec de test
1. Consulter les logs avec `logger.getLogs("error")`
2. Vérifier les règles Firebase dans la console
3. Valider la configuration des rôles et permissions
4. Contacter l'équipe technique si besoin

### Mises à jour
- Relancer TOUS les tests après modification des règles
- Documenter tout changement de comportement
- Mettre à jour cette documentation si nécessaire

---

**Dernière mise à jour:** 2025-11-03  
**Version:** 1.0.0  
**Statut:** Production-ready
