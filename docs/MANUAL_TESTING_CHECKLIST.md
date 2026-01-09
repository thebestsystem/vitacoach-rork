# Checklist de Tests Manuels — Wellness AI Coach

## 🎯 Objectif
Vérifier que toutes les pages et tous les boutons fonctionnent correctement sans erreurs Firebase.

---

## 📋 Tests Flow Complet

### 1. Auth Flow (/auth/login, /auth/signup)

#### Login Page (/auth/login)
- [ ] **Affichage**
  - [ ] Header "Welcome Back" visible
  - [ ] Champ email visible et fonctionnel
  - [ ] Champ password visible et masqué
  - [ ] Bouton "Sign In" visible
  - [ ] Bouton "Create New Account" visible
  
- [ ] **Validation email**
  - [ ] Email vide → Erreur "Please enter both email and password"
  - [ ] Email invalide (ex: "test") → Pas d'envoi (validation côté Firebase)
  - [ ] Email valide → Aucune erreur

- [ ] **Validation password**
  - [ ] Password vide → Erreur "Please enter both email and password"
  - [ ] Password < 8 chars → Firebase error "Password must be at least 8 characters"

- [ ] **Login Success**
  - [ ] Email + password valides → Redirect vers /onboarding (si non complété) ou /(tabs)/home
  - [ ] Aucune erreur "permission-denied"
  - [ ] Logs dans console: "[Auth] User signed in"

- [ ] **Login Failed**
  - [ ] Mauvais password → Alert "Incorrect password"
  - [ ] Email non trouvé → Alert "No account found with this email"

- [ ] **Navigation**
  - [ ] Bouton "Create New Account" → Redirect vers /auth/signup

**Résultat attendu**: ✅ Aucune erreur Firebase, login fonctionnel

---

#### Signup Page (/auth/signup)
- [ ] **Affichage**
  - [ ] Header "Create Account" visible
  - [ ] Champ email visible
  - [ ] Champ password visible
  - [ ] Bouton "Sign Up" visible
  - [ ] Bouton "Already have account" visible

- [ ] **Validation password renforcée**
  - [ ] Password < 8 chars → Erreur
  - [ ] Password sans majuscule → Erreur "must contain uppercase"
  - [ ] Password sans minuscule → Erreur "must contain lowercase"
  - [ ] Password sans chiffre → Erreur "must contain number"
  - [ ] Password valide (ex: "Test1234") → Aucune erreur

- [ ] **Signup Success**
  - [ ] Email + password valides → Compte créé
  - [ ] Email de vérification envoyé
  - [ ] Redirect vers /onboarding
  - [ ] Logs: "[Auth] User signed up", "[Auth] Verification email sent"

- [ ] **Signup Failed**
  - [ ] Email déjà utilisé → Alert "An account with this email already exists"

- [ ] **Navigation**
  - [ ] Bouton "Already have account" → Redirect vers /auth/login

**Résultat attendu**: ✅ Validation password renforcée, aucune erreur Firebase

---

### 2. Onboarding Flow (/onboarding)

#### Étape 1: Nom & Âge
- [ ] **Affichage**
  - [ ] Icône User visible
  - [ ] Titre "Welcome to Your Wellness Journey"
  - [ ] Champ "Name" visible
  - [ ] Champ "Age (optional)" visible
  - [ ] Progress dots (1/3 actif)
  - [ ] Bouton "Continue" désactivé si nom vide

- [ ] **Validation âge**
  - [ ] Âge négatif → Bloqué (ne s'affiche pas)
  - [ ] Âge > 120 → Bloqué
  - [ ] Âge valide (ex: 25) → Accepté
  - [ ] Âge vide → Accepté (optional)

- [ ] **Navigation**
  - [ ] Bouton "Continue" (nom rempli) → Étape 2
  - [ ] Animation de transition (fade)

**Résultat attendu**: ✅ Validation âge fonctionne, transition fluide

---

#### Étape 2: Objectifs
- [ ] **Affichage**
  - [ ] Icône Target visible
  - [ ] Titre "What are your goals?"
  - [ ] 6 cartes d'objectifs visibles
  - [ ] Progress dots (2/3 actif)
  - [ ] Bouton "Continue" désactivé si aucun objectif sélectionné

- [ ] **Sélection**
  - [ ] Clic sur objectif → Border change en primary
  - [ ] Clic à nouveau → Désélection
  - [ ] Au moins 1 objectif sélectionné → Bouton "Continue" activé

- [ ] **Navigation**
  - [ ] Bouton "Back" → Étape 1 (données conservées)
  - [ ] Bouton "Continue" → Étape 3

**Résultat attendu**: ✅ Sélection multiple fonctionne, navigation bi-directionnelle

---

#### Étape 3: Niveau de Fitness
- [ ] **Affichage**
  - [ ] Icône Activity visible
  - [ ] Titre "What's your fitness level?"
  - [ ] 3 cartes (Beginner, Intermediate, Advanced)
  - [ ] Progress dots (3/3 actif)
  - [ ] "Beginner" sélectionné par défaut

- [ ] **Sélection**
  - [ ] Clic sur niveau → Sélection unique (radio-like)

- [ ] **Completion**
  - [ ] Bouton "Get Started" → Loading spinner
  - [ ] Sauvegarde dans Firestore (collection `onboarding/{userId}`)
  - [ ] Redirect vers /(tabs)/home
  - [ ] Logs: "Onboarding completed successfully"

- [ ] **Erreur handling**
  - [ ] Si échec → Alert avec message d'erreur
  - [ ] Bouton redevient cliquable

**Résultat attendu**: ✅ Completion save in Firestore, aucune erreur "permission-denied"

---

### 3. Tabs Navigation

#### Home Tab (/(tabs)/home)
- [ ] **Affichage**
  - [ ] Header avec nom utilisateur
  - [ ] Greeting adapté (Good morning/afternoon/evening)
  - [ ] Today's Progress card
  - [ ] Quick Stats (Steps, Calories, Water, Sleep)
  - [ ] Action buttons (Log Exercise, Log Meal, Wellness Check-in)
  - [ ] Health Insights section

- [ ] **Données chargées**
  - [ ] healthMetrics affichées (steps, calories, etc.)
  - [ ] Pas d'erreur "permission-denied"
  - [ ] Logs: "[Health] Data loaded"

- [ ] **Boutons**
  - [ ] "Log Exercise" → Modal s'ouvre
  - [ ] "Log Meal" → Modal s'ouvre
  - [ ] "Wellness Check-in" → Modal s'ouvre

**Résultat attendu**: ✅ Page charge sans erreur, boutons fonctionnels

---

#### Coach Tab (/(tabs)/coach)
- [ ] **Affichage**
  - [ ] Chat interface visible
  - [ ] Input message visible
  - [ ] Bouton send visible

- [ ] **Fonctionnalités**
  - [ ] Envoi message → Réponse AI
  - [ ] Vérification quota (5 messages/jour en free)
  - [ ] Si quota dépassé → Message d'erreur ou upgrade prompt

**Résultat attendu**: ✅ Chat fonctionnel, quotas respectés

---

#### Plans Tab (/(tabs)/plans)
- [ ] **Affichage**
  - [ ] Onglets (Workout, Meal, Wellness)
  - [ ] Boutons "Generate Plan"
  - [ ] Liste des plans existants

- [ ] **Generate Plan**
  - [ ] Bouton cliqué → Vérification quota
  - [ ] Si quota OK → Plan généré et affiché
  - [ ] Si quota dépassé → Message upgrade
  - [ ] Plan sauvegardé dans Firestore

**Résultat attendu**: ✅ Génération plans fonctionne, quotas respectés

---

#### Track Tab (/(tabs)/track)
- [ ] **Affichage**
  - [ ] Historique d'exercices
  - [ ] Historique de repas
  - [ ] Boutons "Add" pour chaque

- [ ] **Ajout**
  - [ ] Modal s'ouvre
  - [ ] Sauvegarde dans Firestore
  - [ ] Liste mise à jour

**Résultat attendu**: ✅ Tracking fonctionne, données persistées

---

#### Progress Tab (/(tabs)/progress)
- [ ] **Affichage**
  - [ ] Graphiques de progression
  - [ ] Statistiques hebdomadaires
  - [ ] Tendances

- [ ] **Données**
  - [ ] healthHistory chargé depuis Firestore
  - [ ] Graphiques affichent données correctes

**Résultat attendu**: ✅ Graphiques affichent données, pas d'erreur

---

#### Stats Tab (/(tabs)/stats)
- [ ] **Affichage**
  - [ ] Statistiques détaillées
  - [ ] Comparaisons périodes

**Résultat attendu**: ✅ Stats affichées correctement

---

#### Achievements Tab (/(tabs)/achievements)
- [ ] **Affichage**
  - [ ] Liste des achievements
  - [ ] Badges locked/unlocked
  - [ ] Progress bars

- [ ] **Données**
  - [ ] Gamification data chargée
  - [ ] Achievements calculés correctement

**Résultat attendu**: ✅ Achievements affichés, pas d'erreur Firestore

---

#### Dashboard Tab (/(tabs)/dashboard)
- [ ] **Affichage**
  - [ ] Overall Wellness Score (3 circular progress)
  - [ ] Onglets (Health, Activity, Progress, Plan)
  - [ ] KPI Cards

- [ ] **Navigation onglets**
  - [ ] Clic Health → KPIs santé affichés
  - [ ] Clic Activity → KPIs activité affichés
  - [ ] Clic Progress → KPIs gamification affichés
  - [ ] Clic Plan → KPIs subscription affichés

- [ ] **Données**
  - [ ] Tous les KPIs calculés correctement
  - [ ] Pas d'erreur de calcul (NaN, undefined)
  - [ ] Circular progress affiche % corrects

**Résultat attendu**: ✅ Dashboard fonctionne, calculs corrects, aucune erreur

---

#### Subscription Tab (/(tabs)/subscription)
- [ ] **Affichage**
  - [ ] 4 plan cards (Free, Basic, Pro, Premium)
  - [ ] Badge "Most Popular" sur Pro
  - [ ] Bouton "Current Plan" sur plan actuel
  - [ ] Prix et features listés

- [ ] **Trial banner**
  - [ ] Si trial actif → Banner "X days left"
  - [ ] Si trial expiré → Pas de banner

- [ ] **Upgrade**
  - [ ] Bouton "Upgrade" → Alert confirmation
  - [ ] Confirmation → Plan mis à jour dans Firestore
  - [ ] Succès → Alert "Your plan has been upgraded"
  - [ ] Erreur → Alert "Failed to upgrade"

- [ ] **Cancel**
  - [ ] Bouton "Cancel Subscription" visible (si non-free)
  - [ ] Clic → Alert confirmation
  - [ ] Confirmation → cancelAtPeriodEnd = true
  - [ ] Banner "Subscription ends on..." affiché

- [ ] **Reactivate**
  - [ ] Si cancelAtPeriodEnd = true → Bouton "Reactivate"
  - [ ] Clic → Subscription réactivée
  - [ ] Banner disparaît

**Résultat attendu**: ✅ Tous les boutons fonctionnent, aucune erreur Firestore, mock payment flow complet

---

#### Profile Tab (/(tabs)/profile)
- [ ] **Affichage**
  - [ ] Infos utilisateur (email, name)
  - [ ] Bouton "Edit Profile"
  - [ ] Bouton "Sign Out"

- [ ] **Edit Profile**
  - [ ] Modal ou page d'édition
  - [ ] Sauvegarde modifications dans Firestore

- [ ] **Sign Out**
  - [ ] Clic → Déconnexion
  - [ ] Redirect vers /auth/login
  - [ ] Logs: "[Auth] User signed out"

**Résultat attendu**: ✅ Profile éditable, sign out fonctionne

---

## 🚨 Erreurs à Surveiller

### Erreurs Firebase Interdites
❌ `FirebaseError: Missing or insufficient permissions (permission-denied)`
❌ `FirebaseError: Document not found (not-found)` (en usage normal)
❌ `FirebaseError: Resource exhausted (resource-exhausted)` (quota Firestore)

### Erreurs Acceptées (cas d'échec attendus)
✅ `permission-denied` si utilisateur tente d'accéder aux données d'un autre user
✅ `auth/wrong-password` si mauvais password
✅ `auth/email-already-in-use` si email déjà pris

---

## 📊 Résultats Attendus

### Tous les tests passent (✅)
- Aucune page ne crash
- Tous les boutons sont fonctionnels
- Toutes les données Firestore se chargent
- Aucune erreur `permission-denied` en usage légitime
- Logs propres et structurés

### Quelques tests échouent (⚠️)
- Identifier la page/fonctionnalité
- Copier l'erreur exacte
- Vérifier les règles Firestore
- Vérifier le code du composant

### Nombreux tests échouent (❌)
- Problème architectural
- Vérifier config Firebase
- Vérifier rules Firestore/Storage
- Vérifier custom claims

---

## 🔧 Comment Tester

### Mode Développement
```bash
npm run start
# ou
npm run start-web
```

### Outils Recommandés
1. **React Native Debugger** (logs détaillés)
2. **Firebase Console** (vérifier données en temps réel)
3. **Chrome DevTools** (pour web)
4. **Expo Go** (pour mobile)

### Logs à Surveiller
- `[Auth]` : Authentification
- `[Health]` : Données santé
- `[Firestore]` : Opérations Firestore
- `[Subscription]` : Gestion abonnements
- `[Gamification]` : Points/achievements

---

## ✅ Checklist Finale

- [ ] Auth flow complet (login + signup) ✅
- [ ] Onboarding 3 étapes ✅
- [ ] Home tab fonctionne ✅
- [ ] Coach tab fonctionne ✅
- [ ] Plans tab fonctionne ✅
- [ ] Track tab fonctionne ✅
- [ ] Progress tab fonctionne ✅
- [ ] Stats tab fonctionne ✅
- [ ] Achievements tab fonctionne ✅
- [ ] Dashboard tab fonctionne ✅
- [ ] Subscription tab fonctionne ✅
- [ ] Profile tab fonctionne ✅
- [ ] Aucune erreur `permission-denied` ✅
- [ ] Tous les boutons cliquables ✅
- [ ] Toutes les modals s'ouvrent ✅
- [ ] Données Firestore chargées ✅
- [ ] Logs propres et structurés ✅

---

## 📝 Notes

- Ce checklist est pour tests manuels (QA humaine)
- Pour tests automatisés, voir `docs/FIRESTORE_RULES_TESTS.md`
- Si une fonctionnalité échoue, prioriser le fix avant finalisation
- Vérifier sur mobile ET web (comportements différents possibles)
