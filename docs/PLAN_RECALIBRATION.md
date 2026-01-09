# Recalibrage Intelligent des Plans (IA + Biométrie)

## Vue d'ensemble

Le système de **recalibrage intelligent** analyse automatiquement vos données biométriques (sommeil, stress, énergie, fréquence cardiaque) pour ajuster dynamiquement vos plans d'entraînement, de nutrition et de bien-être mental.

Cette fonctionnalité prioritaire (⭐⭐⭐) assure que vos programmes restent toujours alignés avec votre état réel, maximisant ainsi l'efficacité et la rétention.

## Fonctionnalités clés

### 1. Analyse biométrique automatique
- **Surveillance des tendances** : Analyse sur 14 jours des métriques de sommeil, stress et énergie
- **Détection d'anomalies** : Identification automatique des signaux de fatigue et de surmenage
- **Score de récupération** : Calcul d'un score global basé sur les métriques combinées

### 2. Recommandations intelligentes
- **IA contextuelle** : Utilise GPT pour générer des recommandations personnalisées
- **Hiérarchisation** : Classement par sévérité (mineur, modéré, majeur)
- **Transparence** : Explications claires des changements proposés et de leurs bénéfices

### 3. Application flexible
- **Contrôle utilisateur** : Chaque recommandation peut être acceptée ou ignorée
- **Ajustements graduels** : Suggestions conservatrices pour éviter les changements brusques
- **Auto-application** : Option d'application automatique pour les ajustements mineurs

### 4. Intégration dashboard
- **Alertes proactives** : Carte de recalibrage affichée automatiquement quand nécessaire
- **Accès direct** : Navigation simple vers l'écran de recalibrage
- **Conditions de déclenchement** : Affichage intelligent basé sur les seuils biométriques

## Architecture technique

### Fichiers principaux

#### `utils/planRecalibration.ts`
Contient toute la logique de recalibrage :
- `BiometricContext` : Interface pour le contexte biométrique
- `calculateBiometricContext()` : Calcul des moyennes et tendances
- `analyzeAndSuggestRecalibration()` : Génération des recommandations via IA
- `applyWorkoutRecalibration()` : Application des ajustements d'entraînement
- `applyMealRecalibration()` : Application des ajustements nutritionnels
- `applyMentalWellnessRecalibration()` : Application des ajustements bien-être mental
- `shouldTriggerRecalibration()` : Logique de déclenchement

#### `app/plan-recalibration.tsx`
Écran principal de recalibrage :
- Interface utilisateur complète
- Gestion des états (analyse, suggestions, application)
- Affichage des recommandations avec détails
- Actions d'acceptation/refus

#### `components/PlanRecalibrationCard.tsx`
Composant de carte de recommandation :
- Affichage structuré d'une recommandation
- Badges de sévérité colorés
- Liste des changements avant/après
- Actions (Appliquer/Ignorer)

#### `components/RecalibrationAlertCard.tsx`
Carte d'alerte pour le dashboard :
- Design attrayant avec bordure accentuée
- Navigation vers l'écran de recalibrage
- Affichage uniquement quand nécessaire

### Intégration dans `DashboardOverview.tsx`
- Hook `shouldShowRecalibration` calculé dynamiquement
- Affichage conditionnel de la carte d'alerte
- Basé sur les données des 7 derniers jours

## Logique de déclenchement

Le recalibrage est suggéré quand au moins 2 des conditions suivantes sont vraies :

1. **Sommeil insuffisant** : Moyenne < 6.5 heures/nuit
2. **Tendance de sommeil en baisse** : Déclin détecté sur 7 jours
3. **Stress élevé** : Moyenne > 7/10
4. **Tendance de stress en hausse** : Augmentation détectée
5. **Énergie faible** : Moyenne < 4/10
6. **Tendance d'énergie en baisse** : Déclin détecté
7. **Score de récupération bas** : < 50/100
8. **Taux d'achèvement faible** : < 50% des workouts complétés
9. **Taux d'achèvement très élevé** : > 95% (suggère progression)
10. **Compliance nutritionnelle faible** : < 50%

## Contexte biométrique

Le système calcule automatiquement :

```typescript
interface BiometricContext {
  avgSleepHours: number;           // Moyenne de sommeil (14 jours)
  sleepTrend: "improving" | "declining" | "stable";
  avgStressLevel: number;          // Niveau de stress moyen (1-10)
  stressTrend: "improving" | "declining" | "stable";
  avgEnergyLevel: number;          // Niveau d'énergie moyen (1-10)
  energyTrend: "improving" | "declining" | "stable";
  avgHeartRate?: number;           // Fréquence cardiaque moyenne (si disponible)
  recoveryScore: number;           // Score global de récupération (0-100)
  workoutCompletionRate: number;   // Taux d'achèvement des entraînements
  mealComplianceRate: number;      // Taux de suivi nutritionnel
  consistencyScore: number;        // Score de régularité global (0-100)
}
```

## Exemple de recommandation générée

```json
{
  "id": "recal_1234567890_0",
  "type": "workout",
  "severity": "moderate",
  "reason": "Votre sommeil moyen de 5.8h et votre score de récupération de 45/100 indiquent une fatigue accumulée. Il est recommandé de réduire l'intensité de vos entraînements.",
  "biometricTriggers": [
    "Sommeil insuffisant : 5.8h vs 7-8h recommandées",
    "Score de récupération faible : 45/100",
    "Niveau d'énergie en baisse : tendance declining"
  ],
  "changes": [
    {
      "before": "5 séries de 12 répétitions",
      "after": "3 séries de 10 répétitions"
    },
    {
      "before": "Temps de repos : 30 secondes",
      "after": "Temps de repos : 60 secondes"
    },
    {
      "before": "Difficulté : Hard",
      "after": "Difficulté : Medium"
    }
  ],
  "expectedBenefits": [
    "Meilleure récupération musculaire",
    "Réduction du risque de blessure",
    "Amélioration de l'énergie quotidienne",
    "Maintien de la motivation à long terme"
  ]
}
```

## Utilisation

### Pour l'utilisateur

1. **Accès depuis le dashboard** :
   - Une carte d'alerte apparaît automatiquement si un recalibrage est recommandé
   - Cliquer dessus pour accéder à l'écran de recalibrage

2. **Analyse manuelle** :
   - Naviguer vers `/plan-recalibration`
   - Cliquer sur "Analyser mes données"
   - Attendre les recommandations (quelques secondes)

3. **Revue des recommandations** :
   - Lire la raison et les déclencheurs biométriques
   - Examiner les changements proposés (avant/après)
   - Consulter les bénéfices attendus

4. **Actions** :
   - **Appliquer** : Le plan est immédiatement mis à jour
   - **Ignorer** : La recommandation est retirée de la liste

### Pour les développeurs

```typescript
import {
  analyzeAndSuggestRecalibration,
  applyWorkoutRecalibration,
  shouldTriggerRecalibration
} from "@/utils/planRecalibration";

// Analyser et obtenir des recommandations
const suggestions = await analyzeAndSuggestRecalibration(
  userProfile,
  workoutPlans,
  mealPlans,
  mentalWellnessPlans,
  healthHistory,
  wellnessCheckIns,
  exerciseLogs,
  mealLogs
);

// Vérifier si le recalibrage doit être déclenché
if (shouldTriggerRecalibration(biometricContext)) {
  // Afficher l'alerte
}

// Appliquer une recommandation
const updatedPlan = await applyWorkoutRecalibration(
  currentPlan,
  recommendation,
  userProfile
);
```

## Impact sur la rétention

### Avantages mesurables
1. **Personnalisation dynamique** : Plans toujours adaptés à l'état réel
2. **Prévention du burnout** : Détection précoce de la fatigue
3. **Optimisation de la progression** : Ajustements basés sur les performances
4. **Transparence et confiance** : Explications claires des changements

### Métriques de succès
- Taux d'adhésion aux plans recalibrés
- Réduction de l'abandon après fatigue
- Amélioration des scores de récupération
- Augmentation du taux d'achèvement global

## Améliorations futures

### V2
- Intégration native Apple Health / Google Fit
- Synchronisation bidirectionnelle des wearables
- Prédiction de la fatigue avant qu'elle arrive
- Recalibrage automatique configurable par l'utilisateur

### V3
- Machine learning pour personnaliser les seuils
- Historique des recalibrages et impact mesuré
- Comparaisons avec des utilisateurs similaires
- Recommandations proactives (notifications push)

## Tests

### Tests manuels recommandés
1. Créer des données biométriques variées (bon/mauvais sommeil)
2. Tester l'affichage de la carte d'alerte sur le dashboard
3. Vérifier la génération de recommandations
4. Appliquer un recalibrage et valider la mise à jour du plan
5. Tester l'état vide (pas de recommandation)

### Cas limites
- Utilisateur sans plans actifs
- Historique de données insuffisant (< 7 jours)
- Pas de check-ins wellness récents
- Tous les signaux biométriques sont optimaux

## Notes d'implémentation

### Dépendances IA
- Utilise `@rork/toolkit-sdk` pour `generateObject`
- Schéma Zod pour validation stricte des réponses
- Prompt engineering pour recommandations conservatrices

### Performance
- Analyse sur 14 jours maximum (fenêtre glissante)
- Calculs optimisés avec useMemo
- Pas de re-calcul inutile sur le dashboard

### Sécurité
- Aucune donnée sensible n'est loguée
- Prompts IA ne contiennent que des données agrégées
- Contrôle utilisateur total sur l'application des changements

## Support et documentation

Pour toute question ou amélioration :
- Voir `docs/FEATURE_DEVELOPMENT_LIST.md` pour le contexte
- Consulter les types dans `types/health.ts`
- Référencer les exemples dans `utils/planGenerator.ts`

---

**Status** : ✅ Implémenté (Itération 1, Priorité ⭐⭐⭐)
**Impact attendu** : Rétention ++ grâce à des programmes toujours alignés sur l'état réel
