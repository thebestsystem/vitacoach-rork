# Composant Toast - Guide d'Utilisation

## Vue d'ensemble

Le composant Toast fournit un système de notifications visuelles élégant et animé pour afficher des messages temporaires à l'utilisateur. Il est particulièrement utile pour les feedbacks d'opérations de sécurité, de validation et d'état.

---

## Installation

Les dépendances sont déjà incluses dans le projet :
- `react-native` (Animated API)
- `lucide-react-native` (icônes)

Fichiers:
- `components/Toast.tsx` - Composant principal
- `hooks/useToast.ts` - Hook de gestion
- `constants/colors.ts` - Palette de couleurs

---

## Utilisation de Base

### 1. Avec le Hook useToast (Recommandé)

```typescript
import { useToast } from '@/hooks/useToast';
import Toast from '@/components/Toast';

function MyScreen() {
  const { toast, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();

  const handleAction = async () => {
    try {
      await someOperation();
      showSuccess('Opération réussie!');
    } catch (error) {
      showError('Une erreur est survenue');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      
      <Button title="Effectuer une action" onPress={handleAction} />
    </View>
  );
}
```

### 2. Utilisation Directe (Sans Hook)

```typescript
import { useState } from 'react';
import Toast from '@/components/Toast';

function MyScreen() {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const showToast = (message: string, type: typeof toastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        duration={3000}
      />
      
      <Button 
        title="Succès" 
        onPress={() => showToast('Opération réussie!', 'success')} 
      />
    </View>
  );
}
```

---

## Types de Toast

### Success (Vert)
```typescript
showSuccess('Connexion réussie!');
showSuccess('Profil mis à jour avec succès');
showSuccess('Fichier uploadé');
```

### Error (Rouge)
```typescript
showError('Accès refusé - Permissions insuffisantes');
showError('Connexion échouée - Vérifiez vos identifiants');
showError('Quota dépassé');
```

### Warning (Orange)
```typescript
showWarning('Vous approchez de la limite de votre quota');
showWarning('Votre session expire dans 5 minutes');
showWarning('Certaines fonctionnalités sont limitées');
```

### Info (Bleu)
```typescript
showInfo('Vos modifications sont sauvegardées localement');
showInfo('Synchronisation en cours...');
showInfo('Nouvelle fonctionnalité disponible');
```

---

## Intégration avec la Sécurité

### 1. Avec les Erreurs Firebase

```typescript
import { handleFirebaseError, isPermissionDeniedError } from '@/utils/firebaseErrors';
import { useToast } from '@/hooks/useToast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

function ProfileScreen() {
  const { showError, showSuccess } = useToast();

  const updateProfile = async (data: any) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      showSuccess('Profil mis à jour avec succès');
    } catch (error) {
      const friendlyError = handleFirebaseError(error, 'UpdateProfile');
      showError(friendlyError.message);
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
      {/* Contenu */}
    </View>
  );
}
```

### 2. Avec Vérification des Permissions

```typescript
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/useToast';

function WorkoutPlanScreen() {
  const { checkQuotaPermission } = usePermissions();
  const { showError, showSuccess, showWarning } = useToast();

  const createWorkoutPlan = async () => {
    const quotaCheck = checkQuotaPermission('workout_plan');
    
    if (!quotaCheck.allowed) {
      showError(quotaCheck.reason || 'Quota dépassé');
      return;
    }

    try {
      await createPlan();
      showSuccess('Plan d\'entraînement créé!');
    } catch (error) {
      showError('Erreur lors de la création du plan');
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
      <Button title="Créer un plan" onPress={createWorkoutPlan} />
    </View>
  );
}
```

### 3. Avec Authentification

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

function LoginScreen() {
  const { signIn } = useAuth();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Veuillez remplir tous les champs');
      return;
    }

    try {
      await signIn(email, password);
      showSuccess('Connexion réussie!');
      router.replace('/');
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError('Erreur de connexion');
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
      <TextInput value={email} onChangeText={setEmail} />
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Se connecter" onPress={handleLogin} />
    </View>
  );
}
```

---

## Cas d'Usage Avancés

### 1. Toast avec Avertissement de Quota

```typescript
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/hooks/useToast';

function DashboardScreen() {
  const { quotaUsage, quotaLimits } = useSubscription();
  const { showWarning } = useToast();

  useEffect(() => {
    if (quotaUsage && quotaLimits) {
      const workoutUsagePercent = (quotaUsage.workoutPlansThisMonth / quotaLimits.workoutPlansPerMonth) * 100;
      
      if (workoutUsagePercent >= 80 && workoutUsagePercent < 100) {
        showWarning(`Vous avez utilisé ${workoutUsagePercent.toFixed(0)}% de vos plans d'entraînement`);
      }
    }
  }, [quotaUsage, quotaLimits]);

  return (
    <View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      {/* Dashboard content */}
    </View>
  );
}
```

### 2. Toast de Synchronisation

```typescript
import { useToast } from '@/hooks/useToast';
import { syncWithFirebase } from '@/utils/syncQueue';

function OfflineScreen() {
  const { showInfo, showSuccess, showError } = useToast();

  const handleSync = async () => {
    showInfo('Synchronisation en cours...');
    
    try {
      await syncWithFirebase();
      showSuccess('Synchronisation terminée avec succès');
    } catch (error) {
      showError('Erreur de synchronisation - Réessayez plus tard');
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
      <Button title="Synchroniser" onPress={handleSync} />
    </View>
  );
}
```

### 3. Toast avec Actions Multiples

```typescript
import { useToast } from '@/hooks/useToast';

function BatchOperationsScreen() {
  const { showSuccess, showError, showInfo } = useToast();
  const [operations, setOperations] = useState<string[]>([]);

  const handleBatchOperation = async () => {
    showInfo(`Traitement de ${operations.length} opérations...`);
    
    let successCount = 0;
    let errorCount = 0;

    for (const op of operations) {
      try {
        await processOperation(op);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      showSuccess(`${successCount} opérations réussies`);
    } else if (successCount === 0) {
      showError(`${errorCount} opérations échouées`);
    } else {
      showWarning(`${successCount} réussies, ${errorCount} échouées`);
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
      <Button title="Traiter tout" onPress={handleBatchOperation} />
    </View>
  );
}
```

---

## Props du Composant

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | `string` | - | **Requis**. Message à afficher |
| `type` | `'success' \| 'error' \| 'info' \| 'warning'` | `'info'` | Type de toast (détermine couleur et icône) |
| `duration` | `number` | `3000` | Durée d'affichage en ms |
| `onHide` | `() => void` | - | Callback appelé quand le toast se cache |
| `visible` | `boolean` | - | **Requis**. Contrôle la visibilité |

---

## Méthodes du Hook useToast

| Méthode | Signature | Description |
|---------|-----------|-------------|
| `showToast` | `(message: string, type?: ToastType) => void` | Affiche un toast avec type personnalisé |
| `showSuccess` | `(message: string) => void` | Affiche un toast de succès (vert) |
| `showError` | `(message: string) => void` | Affiche un toast d'erreur (rouge) |
| `showWarning` | `(message: string) => void` | Affiche un toast d'avertissement (orange) |
| `showInfo` | `(message: string) => void` | Affiche un toast d'information (bleu) |
| `hideToast` | `() => void` | Cache le toast manuellement |
| `toast` | `{ visible: boolean, message: string, type: ToastType }` | État actuel du toast |

---

## Personnalisation

### 1. Durée Personnalisée

```typescript
<Toast
  visible={toast.visible}
  message={toast.message}
  type={toast.type}
  duration={5000}  // 5 secondes au lieu de 3
  onHide={hideToast}
/>
```

### 2. Position (Modifier dans le style)

```typescript
// Dans components/Toast.tsx, modifier:
const styles = StyleSheet.create({
  container: {
    position: "absolute" as const,
    top: Platform.select({ ios: 50, android: 20, web: 20 }),  // Modifier ici
    // ou
    // bottom: 20,  // Pour afficher en bas
    left: 16,
    right: 16,
    // ...
  },
});
```

### 3. Couleurs Personnalisées

Modifier dans `constants/colors.ts`:
```typescript
const colors = {
  // ...
  success: "#4CAF50",  // Vert
  error: "#EF5350",    // Rouge
  warning: "#FFA726",  // Orange
  info: "#2196F3",     // Bleu
  // ...
};
```

---

## Bonnes Pratiques

### ✅ À Faire

1. **Utiliser le hook useToast** pour une gestion simple
2. **Messages courts et clairs** (max 2 lignes)
3. **Type approprié** selon le contexte
4. **Une seule instance** de Toast par écran
5. **Feedback immédiat** après une action utilisateur

### ❌ À Éviter

1. **Plusieurs toasts simultanés** (créer une file d'attente si nécessaire)
2. **Messages trop longs** (utiliser une modale à la place)
3. **Durées trop courtes** (< 2s) ou trop longues (> 5s)
4. **Surcharge de toasts** (max 1 par action)
5. **Informations critiques** dans les toasts (utiliser Alert ou modale)

---

## Tests

### Test du Composant

```typescript
import { render, waitFor } from '@testing-library/react-native';
import Toast from '@/components/Toast';

test('Toast affiche le message', () => {
  const { getByText } = render(
    <Toast
      visible={true}
      message="Test message"
      type="success"
      onHide={() => {}}
    />
  );
  
  expect(getByText('Test message')).toBeDefined();
});

test('Toast se cache après la durée', async () => {
  const onHide = jest.fn();
  const { getByTestId } = render(
    <Toast
      visible={true}
      message="Test"
      type="info"
      duration={1000}
      onHide={onHide}
    />
  );
  
  await waitFor(() => expect(onHide).toHaveBeenCalled(), { timeout: 2000 });
});
```

### Test du Hook

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useToast } from '@/hooks/useToast';

test('useToast affiche un message de succès', () => {
  const { result } = renderHook(() => useToast());
  
  act(() => {
    result.current.showSuccess('Succès!');
  });
  
  expect(result.current.toast.visible).toBe(true);
  expect(result.current.toast.message).toBe('Succès!');
  expect(result.current.toast.type).toBe('success');
});
```

---

## Dépannage

### Le toast ne s'affiche pas

1. Vérifier que `visible={true}` est bien passé
2. Vérifier que le composant Toast est rendu dans le JSX
3. Vérifier que le z-index est suffisant (9999 par défaut)
4. Vérifier qu'il n'y a pas de SafeAreaView qui masque le toast

### Le toast ne disparaît pas

1. Vérifier que `onHide` est bien défini et met `visible` à `false`
2. Vérifier la valeur de `duration` (ne pas mettre `Infinity`)
3. Vérifier qu'il n'y a pas d'erreur dans la console

### Animation saccadée

1. S'assurer que `useNativeDriver: true` est utilisé
2. Éviter les re-renders fréquents pendant l'animation
3. Utiliser `React.memo` si nécessaire

---

## Roadmap

### Fonctionnalités Futures

- [ ] File d'attente de toasts multiples
- [ ] Actions dans les toasts (boutons)
- [ ] Toasts persistants (jusqu'à action utilisateur)
- [ ] Animations personnalisables
- [ ] Support des images/icônes personnalisées
- [ ] Positions multiples (top, bottom, center)

---

**Dernière mise à jour:** 2025-11-03  
**Version:** 1.0.0  
**Auteur:** Équipe Sécurité
