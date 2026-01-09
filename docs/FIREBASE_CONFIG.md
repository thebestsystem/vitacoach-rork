# Configuration Firebase

## API Keys

### ⚠️ Important: Les API Keys Firebase ne sont PAS des secrets

Les API keys Firebase exposées côté client sont **conçues pour être publiques**. Elles sont protégées par:

1. **Règles de Sécurité Firestore/Storage**
   - Contrôlent qui peut lire/écrire quelles données
   - Basées sur l'authentification et les custom claims

2. **Restrictions d'API (Console Firebase)**
   - Limiter les API keys à des domaines spécifiques
   - Limiter les API keys à des applications spécifiques (iOS, Android)

3. **App Check (Recommandé pour Production)**
   - Vérifie que les requêtes proviennent de votre application
   - Protège contre les abus et le scraping

### Configuration Actuelle

Fichier: `config/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "...",           // ✅ Public, OK d'être exposé
  authDomain: "...",       // ✅ Public
  projectId: "...",        // ✅ Public
  storageBucket: "...",    // ✅ Public
  messagingSenderId: "...", // ✅ Public
  appId: "...",            // ✅ Public
};
```

### Sécurité Réelle

La vraie sécurité provient de:
- ✅ **Règles Firestore** bien configurées
- ✅ **Règles Storage** bien configurées
- ✅ **Custom Claims** sur les tokens JWT
- ✅ **Validation côté serveur** (Functions)
- ✅ **App Check** activé

❌ **Ne PAS** utiliser les API keys pour contrôler l'accès
❌ **Ne PAS** considérer les API keys comme des secrets
❌ **Ne PAS** chercher à cacher les API keys côté client

### Recommandations Production

1. **Activer App Check**
   ```bash
   # Dans Firebase Console
   Build > App Check > Activer
   # Configurer reCAPTCHA (Web)
   # Configurer DeviceCheck/SafetyNet (Mobile)
   ```

2. **Restreindre les API Keys**
   ```
   Firebase Console > Project Settings > API Keys
   - Restreindre chaque key à son plateforme
   - Web: Limiter aux domaines autorisés
   - iOS: Limiter au bundle ID
   - Android: Limiter au package name + SHA-1
   ```

3. **Surveiller l'Usage**
   ```
   Firebase Console > Usage and Billing
   - Configurer des alertes de budget
   - Surveiller les pics d'utilisation suspects
   ```

4. **Rate Limiting (Via Functions)**
   ```typescript
   // Implémenter dans Firebase Functions
   // Limiter le nombre de requêtes par utilisateur/IP
   ```

---

## Variables d'Environnement (Future)

Pour les secrets réels (qui ne doivent JAMAIS être côté client):
- Clés API tierces (Stripe, SendGrid, etc.)
- Tokens d'accès admin
- Secrets de chiffrement

Ces secrets doivent être:
- ✅ Stockés dans Firebase Functions environment config
- ✅ Jamais inclus dans le code client
- ✅ Accédés uniquement via des Functions backend

```bash
# Exemple: Configuration de secrets dans Functions
firebase functions:config:set stripe.key="sk_live_..."
```

---

## Checklist Sécurité Firebase

- [x] API Keys exposées côté client (OK, c'est normal)
- [x] Règles Firestore configurées
- [x] Règles Storage configurées
- [ ] App Check activé (recommandé)
- [ ] Restrictions d'API configurées (console Firebase)
- [ ] Alertes de budget configurées
- [ ] Surveillance des logs activée
- [ ] Functions pour opérations sensibles
- [ ] Custom Claims via Functions

---

## Support

Pour configurer correctement Firebase en production:
- [Firebase Security Checklist](https://firebase.google.com/support/guides/security-checklist)
- [App Check Documentation](https://firebase.google.com/docs/app-check)
- [API Restrictions Best Practices](https://firebase.google.com/docs/projects/api-keys#api-key-restrictions)
