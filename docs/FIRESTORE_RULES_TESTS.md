# Tests de Sécurité Firestore Rules

## Tests Manuels à Effectuer

### Configuration
```bash
# Firebase Emulator (recommandé pour tests locaux)
npm install -g firebase-tools
firebase emulators:start --only firestore
```

### Test 1: Utilisateur ne peut lire que ses propres données
```typescript
// ✅ DEVRAIT RÉUSSIR
const userId = auth.currentUser.uid;
await getDoc(doc(db, 'users', userId));
await getDoc(doc(db, 'healthMetrics', userId));
await getDoc(doc(db, 'subscriptions', userId));

// ❌ DEVRAIT ÉCHOUER (permission-denied)
await getDoc(doc(db, 'users', 'autre-user-id'));
await getDoc(doc(db, 'healthMetrics', 'autre-user-id'));
```

**Résultat attendu:** 
- Succès pour propre userId
- `FirebaseError: permission-denied` pour autre userId

---

### Test 2: Utilisateur ne peut pas s'auto-promouvoir admin
```typescript
const userId = auth.currentUser.uid;

// ❌ DEVRAIT ÉCHOUER (permission-denied)
await updateDoc(doc(db, 'users', userId), {
  role: 'admin'
});

// ✅ DEVRAIT RÉUSSIR (role unchanged)
await updateDoc(doc(db, 'users', userId), {
  name: 'New Name',
  role: 'user' // même role qu'avant
});
```

**Résultat attendu:**
- Échec si tentative de changer role vers 'admin'
- Succès si role inchangé ou vers 'user'/'guest'

---

### Test 3: Validation des données lors de la création
```typescript
const userId = auth.currentUser.uid;

// ❌ DEVRAIT ÉCHOUER (invalid email)
await setDoc(doc(db, 'users', userId), {
  email: 'invalid-email',
  role: 'user',
  subscriptionPlan: 'free',
  subscriptionStatus: 'trial',
  createdAt: new Date().toISOString(),
});

// ❌ DEVRAIT ÉCHOUER (invalid role)
await setDoc(doc(db, 'users', userId), {
  email: 'valid@email.com',
  role: 'admin', // auto-promotion interdite
  subscriptionPlan: 'free',
  subscriptionStatus: 'trial',
  createdAt: new Date().toISOString(),
});

// ✅ DEVRAIT RÉUSSIR
await setDoc(doc(db, 'users', userId), {
  email: 'valid@email.com',
  role: 'user',
  subscriptionPlan: 'free',
  subscriptionStatus: 'trial',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
```

**Résultat attendu:**
- Échec pour email invalide
- Échec pour role='admin'
- Succès pour données valides

---

### Test 4: Validation des métriques de santé
```typescript
const userId = auth.currentUser.uid;

// ❌ DEVRAIT ÉCHOUER (steps négatif)
await setDoc(doc(db, 'healthMetrics', userId), {
  steps: -100,
  heartRate: 72,
});

// ❌ DEVRAIT ÉCHOUER (steps > 100000)
await setDoc(doc(db, 'healthMetrics', userId), {
  steps: 200000,
  heartRate: 72,
});

// ✅ DEVRAIT RÉUSSIR
await setDoc(doc(db, 'healthMetrics', userId), {
  steps: 5000,
  heartRate: 72,
  sleep: 7,
  calories: 2000,
});
```

**Résultat attendu:**
- Échec pour steps < 0 ou > 100000
- Succès pour valeurs valides

---

### Test 5: Gestion des quotas (validation côté client uniquement)
```typescript
const userId = auth.currentUser.uid;

// ✅ DEVRAIT RÉUSSIR (pas de validation dans rules)
await setDoc(doc(db, 'quotaUsage', userId), {
  workoutPlansThisMonth: 5,
  mealPlansThisMonth: 5,
  aiCoachMessagesToday: 10,
  // ...
});

// ⚠️ REMARQUE: La validation des quotas est faite côté client
// Les rules Firestore ne vérifient pas si l'utilisateur a dépassé son quota
```

**Résultat attendu:**
- Succès (les quotas sont gérés par le code client)

---

### Test 6: Admin peut accéder aux données de tous
```typescript
// Nécessite un compte avec role='admin' dans custom claims

// ✅ DEVRAIT RÉUSSIR (si admin)
await getDoc(doc(db, 'users', 'autre-user-id'));
await updateDoc(doc(db, 'users', 'autre-user-id'), {
  subscriptionPlan: 'premium'
});
```

**Résultat attendu:**
- Succès si custom claim role='admin'
- Échec sinon

---

### Test 7: Subscriptions - Utilisateur peut annuler mais pas changer de plan directement
```typescript
const userId = auth.currentUser.uid;

// ✅ DEVRAIT RÉUSSIR (cancel)
await updateDoc(doc(db, 'subscriptions', userId), {
  cancelAtPeriodEnd: true
});

// ❌ DEVRAIT ÉCHOUER (change plan requires admin)
// Sauf si fait via mutation qui vérifie les quotas
await updateDoc(doc(db, 'subscriptions', userId), {
  plan: 'premium',
  status: 'active'
});
```

**Résultat attendu:**
- Succès pour cancelAtPeriodEnd
- Échec si tentative directe de changer plan (doit passer par SubscriptionContext)

---

### Test 8: Storage Rules - Upload de fichiers
```typescript
const userId = auth.currentUser.uid;

// ✅ DEVRAIT RÉUSSIR (image 3MB, format valide)
const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
const storageRef = ref(storage, `users/${userId}/profile/avatar.jpg`);
await uploadBytes(storageRef, file);

// ❌ DEVRAIT ÉCHOUER (fichier > 5MB)
const largeFile = new File([largeBlo], 'large.jpg', { type: 'image/jpeg' });
await uploadBytes(storageRef, largeFile);

// ❌ DEVRAIT ÉCHOUER (mauvais MIME type)
const pdfFile = new File([pdfBlob], 'doc.pdf', { type: 'application/pdf' });
await uploadBytes(storageRef, pdfFile);

// ❌ DEVRAIT ÉCHOUER (autre userId)
const otherUserRef = ref(storage, `users/autre-user-id/profile/avatar.jpg`);
await uploadBytes(otherUserRef, file);
```

**Résultat attendu:**
- Succès pour image valide < 5MB dans son propre dossier
- Échec pour fichier trop grand, mauvais type, ou autre userId

---

## Tests Automatisés (Future - avec @firebase/rules-unit-testing)

```typescript
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Firestore Rules', () => {
  let testEnv;
  let alice;
  let bob;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });

    alice = testEnv.authenticatedContext('alice-uid');
    bob = testEnv.authenticatedContext('bob-uid');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('User can read own data', async () => {
    await assertSucceeds(
      alice.firestore().doc('users/alice-uid').get()
    );
  });

  test('User cannot read other user data', async () => {
    await assertFails(
      alice.firestore().doc('users/bob-uid').get()
    );
  });

  test('User cannot self-promote to admin', async () => {
    await assertFails(
      alice.firestore().doc('users/alice-uid').update({ role: 'admin' })
    );
  });

  test('Invalid email is rejected', async () => {
    await assertFails(
      alice.firestore().doc('users/alice-uid').set({
        email: 'invalid-email',
        role: 'user',
        subscriptionPlan: 'free',
        subscriptionStatus: 'trial',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  });
});
```

---

## Checklist de Tests Manuels

- [ ] Test 1: Isolation des données utilisateur ✅
- [ ] Test 2: Anti auto-promotion admin ✅
- [ ] Test 3: Validation email, role, plan ✅
- [ ] Test 4: Validation métriques de santé ✅
- [ ] Test 5: Quotas (client-side) ✅
- [ ] Test 6: Accès admin ✅
- [ ] Test 7: Gestion subscriptions ✅
- [ ] Test 8: Upload fichiers Storage ✅

---

## Outils Recommandés

1. **Firebase Emulator Suite**
   ```bash
   firebase emulators:start --only firestore,storage
   ```

2. **@firebase/rules-unit-testing** (pour CI/CD)
   ```bash
   npm install --save-dev @firebase/rules-unit-testing
   ```

3. **Console Firebase** (tests manuels production)
   - Créer des comptes de test
   - Vérifier permissions dans Firestore console

---

## Notes Importantes

- ⚠️ **get() dans rules** : La fonction `getUserRole()` fait une lecture supplémentaire. 
  Solution: Custom Claims via Firebase Functions.

- ⚠️ **Quotas non vérifiés dans rules** : Les quotas sont gérés côté client via `usePermissions` et `quotas.ts`.
  Pour plus de sécurité, ajouter validation dans Firebase Functions.

- ⚠️ **Pas de rate limiting** : Firebase ne supporte pas de rate limiting natif dans les rules.
  Solution: App Check + Cloud Functions.

---

## Résultats Attendus en Production

### Cas de succès (0 erreur)
- Utilisateur accède à ses propres données
- Utilisateur crée/modifie ses données avec validations OK
- Admin accède à toutes les données

### Cas d'échec attendus (permission-denied)
- Utilisateur tente d'accéder aux données d'autrui
- Tentative d'auto-promotion admin
- Données invalides (email, steps négatif, etc.)
- Upload fichier trop grand ou mauvais type

### Monitoring
Surveiller dans Firebase Console:
- Nombre de `permission-denied` errors
- Tentatives d'auto-promotion (logs `[Auth]`)
- Uploads de fichiers rejetés
