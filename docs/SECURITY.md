# Sécurité Firebase - Documentation

## Architecture de Sécurité

### 1. Authentification & Custom Claims

#### État Actuel (Sans Firebase Functions)
- **Authentification:** Firebase Auth (email/password)
- **Rôles:** Définis dans Firestore `/users/{userId}.role`
- **Custom Claims JWT:** Non implémentés (nécessite Firebase Functions)

#### Rôles Disponibles
- `user`: Utilisateur standard (par défaut à la création)
- `guest`: Utilisateur invité (accès limité)
- `admin`: Administrateur (accès complet)

#### Workaround Actuel
Les règles Firestore utilisent `isAdminByDoc()` qui:
1. Vérifie d'abord `request.auth.token.role` (custom claim si disponible)
2. Si non disponible, lit le document `/users/{userId}` pour obtenir le rôle

**⚠️ Limitation:** La fonction `get()` dans les règles compte comme une lecture supplémentaire.

---

### 2. Plans d'Abonnement

#### Plans Disponibles
- **Free**: 3 plans workout/mois, 3 plans meal/mois, 5 messages AI/jour
- **Basic**: 10 plans workout/mois, 10 plans meal/mois, 20 messages AI/jour
- **Pro**: 50 plans workout/mois, 50 plans meal/mois, 100 messages AI/jour
- **Premium**: Illimité

#### Statuts d'Abonnement
- `trial`: Essai gratuit (14 jours)
- `active`: Abonnement actif
- `canceled`: Annulé (actif jusqu'à fin de période)
- `expired`: Expiré

---

### 3. Règles de Sécurité Firestore

#### Principe de Moindre Privilège (PoLP)
Toutes les collections suivent ce modèle:
- **Lecture**: Propriétaire OU Admin
- **Écriture**: Propriétaire uniquement (Admin pour opérations sensibles)

#### Collections & Permissions

##### `/users/{userId}`
- **Lecture**: Propriétaire ou Admin
- **Création**: 
  - Uniquement par le propriétaire
  - Email valide requis
  - Rôle limité à 'user' ou 'guest' (pas 'admin')
  - SubscriptionPlan et Status validés
- **Mise à jour**: 
  - Propriétaire (ne peut pas changer `role` ni `createdAt`)
  - Admin (peut tout modifier)
- **Suppression**: Admin uniquement

##### `/userProfiles/{userId}`, `/healthMetrics/{userId}`, etc.
- **Lecture**: Propriétaire ou Admin
- **Écriture**: Propriétaire uniquement

##### `/subscriptions/{userId}`
- **Lecture**: Propriétaire ou Admin
- **Création**: 
  - Propriétaire uniquement
  - Plan validé (free, basic, pro, premium)
  - Status validé (active, trial, canceled, expired)
- **Mise à jour**:
  - Propriétaire: Peut annuler (`cancelAtPeriodEnd = true`) uniquement
  - Admin: Peut tout modifier
- **Suppression**: Admin uniquement

##### `/quotaUsage/{userId}`
- **Lecture**: Propriétaire ou Admin
- **Écriture**: 
  - Propriétaire uniquement
  - Validation: valeurs >= 0

##### `/adminSettings/{document=**}`
- **Lecture/Écriture**: Admin uniquement

---

### 4. Règles de Sécurité Storage

#### Structure des Chemins

##### `/users/{userId}/profile/{fileName}`
- **Lecture**: Authentifié
- **Écriture**: 
  - Propriétaire uniquement
  - Max 5MB
  - Images uniquement

##### `/users/{userId}/exercise/{fileName}`
- **Lecture**: Propriétaire uniquement
- **Écriture**:
  - Propriétaire uniquement
  - Max 10MB
  - Images ou vidéos

##### `/users/{userId}/meals/{fileName}`
- **Lecture**: Propriétaire uniquement
- **Écriture**:
  - Propriétaire uniquement
  - Max 5MB
  - Images uniquement

---

### 5. Gestion des Erreurs

#### Erreurs Firebase Communes

##### `permission-denied`
**Causes:**
- Utilisateur non authentifié
- Tentative d'accès aux données d'un autre utilisateur
- Tentative de modification de champs protégés (role, createdAt)
- Validation échouée (email invalide, valeurs négatives, etc.)

**Actions:**
- Vérifier l'authentification
- Vérifier que l'userId correspond à l'utilisateur connecté
- Vérifier les validations des données

##### `not-found`
**Causes:**
- Document n'existe pas
- Mauvais chemin de collection

**Actions:**
- Initialiser le document si nécessaire
- Vérifier le nom de la collection

---

### 6. Bonnes Pratiques

#### Côté Client
1. **Toujours vérifier l'authentification** avant toute opération Firestore
2. **Valider les données** avant envoi (email, valeurs numériques, etc.)
3. **Gérer les erreurs** de permissions explicitement
4. **Utiliser les hooks de contexte** (useAuth, useHealth) qui gèrent les permissions
5. **Ne jamais exposer de logique sensible** côté client

#### Validation des Données
```typescript
// Exemple: Validation avant création d'un utilisateur
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidRole = (role: string) => ['user', 'guest'].includes(role);

if (!isValidEmail(email) || !isValidRole(role)) {
  throw new Error('Invalid data');
}
```

#### Gestion des Quotas
```typescript
// Vérifier le quota AVANT l'opération
const { allowed, usage, limit } = await checkQuota(userId, plan, 'workoutPlansThisMonth');
if (!allowed) {
  throw new Error(`Quota exceeded: ${usage}/${limit}`);
}

// Effectuer l'opération
await addWorkoutPlan(plan);

// Incrémenter le quota
await incrementQuota(userId, 'workoutPlansThisMonth');
```

---

### 7. Migration Future - Firebase Functions

#### Custom Claims via Functions
Lorsque Firebase Functions sera activé, implémenter:

```typescript
// functions/src/index.ts
export const setCustomClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    
    if (!newData) return;
    
    await admin.auth().setCustomUserClaims(userId, {
      role: newData.role,
      subscriptionPlan: newData.subscriptionPlan,
      subscriptionStatus: newData.subscriptionStatus,
    });
  });
```

**Avantages:**
- Pas de lecture supplémentaire dans les règles
- Claims JWT vérifiés automatiquement
- Meilleure performance

---

### 8. Tests de Sécurité

#### Cas de Test Obligatoires

##### Test 1: Utilisateur ne peut lire que ses propres données
```typescript
// ✅ Devrait réussir
await getDoc(doc(db, 'healthMetrics', currentUser.uid));

// ❌ Devrait échouer (permission-denied)
await getDoc(doc(db, 'healthMetrics', 'autre-user-id'));
```

##### Test 2: Utilisateur ne peut pas s'auto-promouvoir admin
```typescript
// ❌ Devrait échouer (permission-denied)
await updateDoc(doc(db, 'users', currentUser.uid), {
  role: 'admin'
});
```

##### Test 3: Validation des données
```typescript
// ❌ Devrait échouer (email invalide)
await setDoc(doc(db, 'users', currentUser.uid), {
  email: 'invalid-email',
  role: 'user',
  subscriptionPlan: 'free',
  subscriptionStatus: 'trial'
});
```

##### Test 4: Admin peut accéder aux données de tous
```typescript
// ✅ Devrait réussir (si currentUser est admin)
await getDoc(doc(db, 'users', 'autre-user-id'));
```

---

### 9. Surveillance & Alertes

#### Métriques à Surveiller
- Nombre de `permission-denied` errors
- Tentatives de modifications de rôles
- Création de comptes en masse
- Upload de fichiers volumineux
- Dépassements de quotas

#### Actions Recommandées
1. **Logs structurés** avec niveau (debug, info, warn, error, critical)
2. **Alertes** sur erreurs critiques (tentatives de privilege escalation)
3. **Audit trail** des modifications sensibles (rôles, subscriptions)

---

### 10. Composant Toast - Feedback Utilisateur

#### Utilisation du Toast

Le composant Toast fournit un feedback visuel pour les opérations de sécurité.

**Types de Toast:**
- `success`: Opération réussie (connexion, création, mise à jour)
- `error`: Erreur bloquante (permission refusée, validation échouée)
- `warning`: Avertissement (quota proche de la limite)
- `info`: Information générale

**Exemple d'utilisation:**
```typescript
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

function MyComponent() {
  const { toast, showError, showSuccess, hideToast } = useToast();

  const handleOperation = async () => {
    try {
      await someSecureOperation();
      showSuccess('Opération réussie!');
    } catch (error) {
      if (isPermissionDeniedError(error)) {
        showError('Accès refusé - Permissions insuffisantes');
      } else {
        showError('Une erreur est survenue');
      }
    }
  };

  return (
    <View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      {/* Votre contenu */}
    </View>
  );
}
```

#### Intégration avec la Gestion d'Erreurs

Le Toast est automatiquement intégré avec `firebaseErrors.ts`:

```typescript
import { handleFirebaseError } from '@/utils/firebaseErrors';
import { useToast } from '@/hooks/useToast';

function SecureComponent() {
  const { showError } = useToast();

  const handleSecureAction = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
    } catch (error) {
      const friendlyError = handleFirebaseError(error, 'UpdateUser');
      showError(friendlyError.message);
    }
  };
}
```

---

### 11. Checklist de Sécurité

- [x] Règles Firestore implémentées et testées
- [x] Règles Storage implémentées et testées
- [x] Validation des emails
- [x] Protection des champs sensibles (role, createdAt)
- [x] Quotas définis par plan
- [x] Gestion des erreurs de permissions
- [x] Logs structurés
- [x] Composant Toast pour feedback utilisateur
- [x] Hook useToast pour gestion simplifiée
- [x] Documentation complète des tests (SECURITY_TESTS.md)
- [ ] Custom Claims JWT (nécessite Functions)
- [ ] Tests automatisés des règles
- [ ] Rate limiting (nécessite Functions)
- [ ] Monitoring et alertes production
- [ ] Audit trail complet

---

## Ressources et Documentation

### Documentation Interne
- **SECURITY_TESTS.md**: Tests de sécurité complets et procédures de validation
- **FIREBASE_CONFIG.md**: Configuration Firebase et variables d'environnement
- **DASHBOARD_MODULE.md**: Documentation du module Dashboard et KPIs

### Composants de Sécurité
- **Toast** (`components/Toast.tsx`): Feedback visuel pour les opérations
- **ErrorFallback** (`components/ErrorFallback.tsx`): Affichage d'erreurs inline
- **GlobalErrorBoundary** (`components/GlobalErrorBoundary.tsx`): Capture des erreurs React

### Utilitaires
- **firebaseErrors.ts**: Détection et traduction des erreurs Firebase
- **logger.ts**: Système de logging structuré
- **usePermissions**: Hook de vérification des permissions
- **useToast**: Hook de gestion des toasts

---

## Support

Pour toute question sur la sécurité, contacter l'équipe technique ou consulter:
- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firebase Auth Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- Documentation interne: `docs/SECURITY_TESTS.md`
