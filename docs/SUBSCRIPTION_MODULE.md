# Module Abonnements & Paiements

## ⚠️ État Actuel - Satisfaction: 74% (MOCK ONLY)

### 🎭 Système MOCK - Non Production Ready

**IMPORTANT**: Ce module est actuellement un **système de démonstration complet**. 
Il simule tous les workflows d'abonnement mais **NE TRAITE AUCUN PAIEMENT RÉEL**.

### ✅ Fonctionnalités Implémentées (Demo)

1. **Plans d'abonnement**
   - Free: $0/mois (3 workout plans/mois, 3 meal plans/mois)
   - Basic: $9.99/mois (10 workout, 10 meal plans)
   - Pro: $19.99/mois (50 workout, 50 meal plans) - **Most Popular**
   - Premium: $39.99/mois (Unlimited)

2. **Trial Management**
   - 14 jours d'essai gratuit automatique
   - Countdown affichage des jours restants
   - Banner d'avertissement

3. **Gestion des abonnements**
   - Upgrade instantané entre plans
   - Cancel subscription (actif jusqu'à fin de période)
   - Reactivate subscription
   - Real-time sync Firestore (onSnapshot)

4. **UX/UI**
   - Design professionnel avec icônes par plan
   - Badge "Most Popular" sur plan Pro
   - Confirmations Alert avant actions critiques
   - Haptic feedback
   - États de loading

5. **Stockage**
   - Collection Firestore: `/subscriptions/{userId}`
   - Structure:
     ```typescript
     {
       userId: string;
       plan: "free" | "basic" | "pro" | "premium";
       status: "active" | "canceled" | "expired" | "trial";
       startDate: string; // ISO
       endDate: string; // ISO
       trialEndsAt?: string;
       cancelAtPeriodEnd: boolean;
       paymentMethod?: string;
       lastPaymentDate?: string;
       nextBillingDate?: string;
       amount?: number;
       currency?: string;
     }
     ```

---

## ❌ Limitations Critiques - Bloquants Production

### 1. Pas de Provider de Paiement
**Impact**: Aucun paiement réel ne peut être traité

**Ce qui manque:**
- Intégration Stripe, RevenueCat, ou autre
- Création de payment intent
- Gestion des cartes bancaires
- Webhooks pour notifications backend
- Vérification des paiements

**Solutions recommandées:**

#### Option A: Stripe (Web + Mobile)
```typescript
// Installation
npm install @stripe/stripe-react-native

// Client
import { useStripe } from '@stripe/stripe-react-native';

const handleUpgrade = async (plan: SubscriptionPlan) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // 1. Create payment intent via Firebase Function
  const paymentIntent = await functions.httpsCallable('createPaymentIntent')({
    plan,
    amount: allPlans[plan].price * 100,
  });
  
  // 2. Initialize payment sheet
  await initPaymentSheet({
    paymentIntentClientSecret: paymentIntent.clientSecret,
    merchantDisplayName: 'Wellness AI Coach',
  });
  
  // 3. Present payment sheet
  const { error } = await presentPaymentSheet();
  
  if (!error) {
    // Payment successful - webhook will update subscription
  }
};

// Backend (Firebase Functions)
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: data.amount,
    currency: 'usd',
    metadata: {
      userId: context.auth.uid,
      plan: data.plan,
    },
  });
  
  return { clientSecret: paymentIntent.client_secret };
});

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  
  if (event.type === 'payment_intent.succeeded') {
    // Update subscription in Firestore
    // Set custom claims
  }
  
  res.json({ received: true });
});
```

#### Option B: RevenueCat (Mobile-first, plus simple)
```typescript
// Installation
npm install react-native-purchases

// Configuration
import Purchases from 'react-native-purchases';

await Purchases.configure({
  apiKey: Platform.select({
    ios: 'ios_key',
    android: 'android_key',
  }),
  appUserID: user.uid,
});

// Purchase
const handleUpgrade = async (plan: SubscriptionPlan) => {
  try {
    const offering = await Purchases.getOfferings();
    const package = offering.current.availablePackages.find(
      p => p.identifier === plan
    );
    
    const { customerInfo } = await Purchases.purchasePackage(package);
    
    // RevenueCat webhook auto-update subscription
    await refreshUserClaims();
  } catch (error) {
    if (error.userCancelled) return;
    throw error;
  }
};
```

### 2. Pas de Custom Claims via Functions
**Impact**: Performance (get() dans rules) + Custom Claims pas mis à jour après paiement

**Solution:**
```typescript
// functions/src/index.ts
export const onSubscriptionUpdate = functions.firestore
  .document('subscriptions/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const newData = change.after.data();
    
    if (!newData) return;
    
    await admin.auth().setCustomUserClaims(userId, {
      subscriptionPlan: newData.plan,
      subscriptionStatus: newData.status,
      role: newData.role || 'user',
    });
    
    // Also update users collection
    await admin.firestore().doc(`users/${userId}`).update({
      subscriptionPlan: newData.plan,
      subscriptionStatus: newData.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
```

### 3. Pas de Gestion des Échecs de Paiement
**Impact**: Utilisateurs avec abonnement actif mais paiement échoué

**Ce qui manque:**
- Retry logic
- Notifications email
- Période de grâce
- Downgrade automatique après X échecs

**Solution:**
```typescript
export const handleFailedPayment = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const expiredSubs = await admin.firestore()
      .collection('subscriptions')
      .where('status', '==', 'active')
      .where('nextBillingDate', '<', new Date())
      .get();
    
    for (const doc of expiredSubs.docs) {
      // Try to charge
      const chargeSuccess = await retryCharge(doc.id);
      
      if (!chargeSuccess) {
        // Send email notification
        await sendEmail(doc.data().email, 'Payment Failed');
        
        // After 3 days, downgrade
        if (daysSinceFailure > 3) {
          await doc.ref.update({
            status: 'expired',
            plan: 'free',
          });
        }
      }
    }
  });
```

### 4. Pas de Factures / Invoices
**Impact**: Compliance, comptabilité, support client

**Solution:** Stripe/RevenueCat génèrent automatiquement des factures

---

## 🎯 Roadmap vers Production (90%+)

### Phase 1: Intégration Paiements (Priorité 1)
- [ ] Choisir provider (Stripe ou RevenueCat)
- [ ] Configurer comptes production
- [ ] Implémenter payment flow
- [ ] Tester en mode sandbox
- [ ] Configurer webhooks
- [ ] Ajouter gestion erreurs de paiement

### Phase 2: Backend Functions (Priorité 1)
- [ ] Activer Firebase Functions
- [ ] Créer Cloud Function pour custom claims
- [ ] Webhook handler pour provider de paiement
- [ ] Scheduled function pour abonnements expirés
- [ ] Function pour retry failed payments

### Phase 3: Features Manquantes (Priorité 2)
- [ ] Historique des paiements
- [ ] Téléchargement factures PDF
- [ ] Changement méthode de paiement
- [ ] Coupons / codes promo
- [ ] Affiliate program

### Phase 4: Compliance & Legal (Priorité 1)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Refund policy
- [ ] Auto-renew disclaimers (Apple, Google)
- [ ] GDPR compliance

### Phase 5: Tests (Priorité 1)
- [ ] Tests unitaires upgrade/downgrade
- [ ] Tests webhook handlers
- [ ] Tests failed payments
- [ ] Tests trial expiration
- [ ] E2E tests payment flow

---

## 📊 Métriques de Qualité Actuelles

### Tests & Stabilité (28/40)
- ✅ Code robuste, pas de crashes
- ✅ Error handling avec try/catch
- ✅ Loading states gérés
- ❌ Pas de tests automatisés
- ❌ Pas de tests paiements réels

### Sécurité (15/25)
- ✅ Firestore rules limitent accès
- ✅ Confirmations avant actions critiques
- ❌ Pas de validation paiement
- ❌ Upgrade instantané sans vérification
- ❌ Pas de rate limiting

### Performance (13/15)
- ✅ React Query caching optimal
- ✅ onSnapshot real-time efficient
- ✅ Mutations optimistes

### UX (10/10)
- ✅ Design professionnel
- ✅ Feedbacks clairs
- ✅ Haptic feedback
- ✅ Trial countdown

### Observabilité (8/10)
- ✅ Logs structurés
- ✅ Error tracking
- ❌ Pas de métriques paiements

**Total actuel: 74/100**

---

## 🚨 Checklist Pré-Production

- [ ] Provider de paiement intégré et testé
- [ ] Webhooks configurés et testés
- [ ] Firebase Functions déployées
- [ ] Custom Claims automatiques
- [ ] Failed payments handling
- [ ] Factures générées automatiquement
- [ ] Terms & Privacy policies
- [ ] Apple/Google subscription compliance
- [ ] Tests E2E paiements
- [ ] Monitoring des revenus
- [ ] Support client pour billing

---

## 📚 Ressources

### Providers de Paiement
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [Firebase + Stripe Extension](https://firebase.google.com/products/extensions/stripe-firestore-payments)

### Compliance
- [Apple In-App Purchase Guidelines](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)

### Code
- `contexts/SubscriptionContext.tsx`: État et mutations
- `app/(tabs)/subscription.tsx`: UI
- `utils/quotas.ts`: Limites par plan
- `firestore.rules`: Règles sécurité subscriptions
