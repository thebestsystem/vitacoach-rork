# Module Authentification & Autorisation

## État Actuel - Satisfaction: 78% → 85%

### ✅ Fonctionnalités Implémentées

1. **Authentification Firebase**
   - Email/Password avec validation renforcée (8+ chars, majuscule, minuscule, chiffre)
   - Email de vérification automatique
   - Reset password
   - Gestion des erreurs traduite en français

2. **Gestion des Rôles**
   - `admin`: Accès complet
   - `user`: Accès standard
   - `guest`: Lecture seule
   - Claims JWT: role, subscriptionPlan, subscriptionStatus

3. **Sécurité**
   - Validation côté client (email, password)
   - Protection anti auto-promotion admin (Firestore rules)
   - Messages d'erreur user-friendly
   - Logs structurés pour debugging

4. **Migration de données**
   - AsyncStorage → Firebase automatique
   - Détection intelligente de migration nécessaire

---

## ⚠️ Limitations Connues

### 1. Custom Claims sans Firebase Functions
**Impact**: Performance et coût Firestore
- Les rules Firestore utilisent `get()` pour vérifier les rôles
- Chaque vérification = 1 lecture Firestore supplémentaire
- **Workaround actuel**: Fonction `getUserRole()` dans rules

**Solution future** (nécessite Functions):
```typescript
// functions/src/index.ts
export const setCustomClaims = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const userData = change.after.data();
    await admin.auth().setCustomUserClaims(context.params.userId, {
      role: userData.role,
      subscriptionPlan: userData.subscriptionPlan,
      subscriptionStatus: userData.subscriptionStatus,
    });
  });
```

### 2. Pas de Rate Limiting
**Impact**: Vulnérabilité aux attaques brute force
- Aucune limite sur tentatives de connexion
- Firebase Auth a un rate limit par défaut, mais pas configurable

**Solution future** (nécessite Functions):
```typescript
export const loginRateLimit = functions.https.onCall(async (data, context) => {
  const ip = context.rawRequest.ip;
  const attempts = await getLoginAttempts(ip);
  if (attempts > 5) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many attempts');
  }
});
```

### 3. Pas de 2FA
**Impact**: Sécurité des comptes sensibles
- Authentification simple email/password uniquement
- Pas de second facteur

**Solution future**:
- Utiliser Firebase Auth Phone/SMS
- ou TOTP avec bibliothèque tierce

### 4. Vérification Email non obligatoire
**Impact**: Comptes avec emails invalides
- L'email de vérification est envoyé mais non vérifié avant accès
- Utilisateur peut accéder à l'app sans vérifier son email

**Solution**:
```typescript
// Dans onAuthStateChanged
if (!currentUser.emailVerified) {
  // Rediriger vers page de vérification
  // Bloquer accès aux fonctionnalités principales
}
```

---

## 🎯 Prochaines Améliorations (pour atteindre 90%+)

### Priorité 1: Tests Automatisés
```typescript
// tests/auth.test.ts
describe('Authentication', () => {
  it('should reject weak passwords', async () => {
    await expect(signUp('test@example.com', 'weak')).rejects.toThrow();
  });
  
  it('should prevent self-promotion to admin', async () => {
    // Test Firestore rules
  });
});
```

### Priorité 2: Session Management
- Implémentation de refresh tokens
- Déconnexion automatique après inactivité
- Détection de sessions multiples

### Priorité 3: Audit Trail
- Logger toutes les connexions/déconnexions
- Alertes sur activités suspectes
- Dashboard admin pour monitoring

---

## 📊 Métriques de Qualité

### Tests & Stabilité (30/40)
- ✅ Logs structurés
- ✅ Error handling robuste
- ❌ Pas de tests unitaires
- ❌ Pas de tests d'intégration

### Sécurité (20/25)
- ✅ Validation password renforcée (8+ chars)
- ✅ Protection rules Firestore
- ✅ Email verification envoyée
- ❌ Pas de rate limiting
- ❌ Pas de 2FA

### Performance (12/15)
- ✅ React Query caching
- ✅ Optimisations useMemo/useCallback
- ❌ get() dans rules = overhead

### UX (8/10)
- ✅ Messages d'erreur clairs
- ✅ Flow fluide
- ❌ Pas de feedback sur force du password

### Observabilité (8/10)
- ✅ Logs contextualisés
- ✅ Error tracking
- ❌ Pas de métriques temps réel

**Total: 78/100**

---

## 🔧 Configuration Requise

### Variables d'environnement
Aucune - Firebase config dans `config/firebase.ts`

### Règles Firestore
```
match /users/{userId} {
  allow read: if isOwner(userId) || isAdminByToken();
  allow create: if isOwner(userId) && validUserData();
  allow update: if isOwner(userId) || isAdminByToken();
}
```

### Permissions requises
- Firebase Auth (email/password)
- Firestore (users collection)
- Email sending (verification emails)

---

## 📚 Références

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Custom Claims Best Practices](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Security Rules Guide](https://firebase.google.com/docs/rules)
- `docs/SECURITY.md`: Guide complet de sécurité
- `contexts/AuthContext.tsx`: Implémentation
