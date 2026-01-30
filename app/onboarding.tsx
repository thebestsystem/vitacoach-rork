import { Heart, Target, Activity, User, Zap, TrendingUp, Bell, Check, MessageCircle, Briefcase, Brain, Battery } from "lucide-react-native";
import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, ActivityIndicator, FlatList, Dimensions, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import { useHealth } from "@/contexts/HealthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import type { Goal, ProfessionalRole } from "@/types/health";
import * as Haptics from "expo-haptics";

const GOALS_OPTIONS: { id: Goal; label: string; icon: typeof Heart }[] = [
  { id: "optimize_performance", label: "Performance Max", icon: Zap },
  { id: "increase_focus", label: "Focus & Clarté", icon: Brain },
  { id: "prevent_burnout", label: "Éviter le Burnout", icon: Battery },
  { id: "boost_energy", label: "Énergie Stable", icon: Activity },
  { id: "stress_management", label: "Gestion du Stress", icon: Heart },
  { id: "better_sleep", label: "Sommeil Réparateur", icon: Heart },
  { id: "weight_loss", label: "Perte de poids", icon: Target },
  { id: "muscle_gain", label: "Prise de muscle", icon: Activity },
];

const ROLES: { id: ProfessionalRole; label: string; desc: string }[] = [
  { id: "founder", label: "Fondateur", desc: "Je construis une entreprise" },
  { id: "solopreneur", label: "Solopreneur", desc: "Je gère tout seul" },
  { id: "executive", label: "Dirigeant", desc: "Je gère des équipes" },
  { id: "freelancer", label: "Freelance", desc: "Je travaille à mon compte" },
  { id: "employee", label: "Salarié", desc: "Je veux performer au travail" },
];

const FITNESS_LEVELS = [
  { id: "beginner" as const, label: "Débutant", desc: "Je commence" },
  { id: "intermediate" as const, label: "Intermédiaire", desc: "J'ai de l'expérience" },
  { id: "advanced" as const, label: "Avancé", desc: "Je suis très actif" },
];

const FEATURES = [
  {
    id: 1,
    icon: MessageCircle,
    title: "Coach Exécutif IA",
    description: "Un coach de performance disponible 24/7 pour optimiser votre énergie et votre productivité",
    color: colors.primary,
  },
  {
    id: 2,
    icon: Brain,
    title: "Focus & Clarté",
    description: "Des protocoles pour éliminer le brouillard mental et maximiser vos heures de Deep Work",
    color: colors.secondary,
  },
  {
    id: 3,
    icon: Battery,
    title: "Gestion d'Énergie",
    description: "Analysez vos cycles pour travailler quand vous êtes le plus performant",
    color: colors.accent,
  },
  {
    id: 4,
    icon: Zap,
    title: "ROI Santé",
    description: "Transformez votre santé en avantage compétitif pour votre business",
    color: colors.warning,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useHealth();
  const { requestPermission } = useNotifications();
  const [step, setStep] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [role, setRole] = useState<ProfessionalRole>("founder");
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([]);
  const [fitnessLevel, setFitnessLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [featureIndex, setFeatureIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList>(null);

  const toggleGoal = (goal: Goal) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleFeatureScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setFeatureIndex(index);
  };

  const nextStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep(step + 1);
  };

  const prevStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep(step - 1);
  };

  const handleComplete = async () => {
    if (isCompleting) {
      return;
    }
    
    try {
      setIsCompleting(true);
      
      const profileData = {
        name,
        age: age ? parseInt(age, 10) : undefined,
        role,
        goals: selectedGoals,
        fitnessLevel,
      };
      
      await completeOnboarding(profileData);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      router.replace("/(tabs)/home");
    } catch (error) {
      setIsCompleting(false);
      
      if (error instanceof Error) {
        Alert.alert("Erreur", `L'intégration a échoué: ${error.message}. Veuillez réessayer.`);
      } else {
        Alert.alert("Erreur", "Une erreur inattendue est survenue. Veuillez réessayer.");
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIconContainer}>
                <MessageCircle size={80} color={colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.welcomeTitle}>Votre OS de{"\n"}Haute Performance</Text>
              <Text style={styles.welcomeSubtitle}>
                Optimisez votre énergie, votre focus et votre santé pour soutenir votre ambition.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={nextStep}
              testID="get-started-button"
            >
              <Text style={styles.buttonText}>Optimiser ma performance</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <Zap size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Découvrez VitaCoach</Text>
            <Text style={styles.stepSubtitle}>Faites glisser pour explorer</Text>

            <FlatList
              ref={flatListRef}
              data={FEATURES}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleFeatureScroll}
              scrollEventThrottle={16}
              style={styles.featureList}
              renderItem={({ item }) => {
                const IconComponent = item.icon;
                return (
                  <View style={styles.featureCard}>
                    <View style={[styles.featureIconContainer, { backgroundColor: `${item.color}15` }]}>
                      <IconComponent size={48} color={item.color} strokeWidth={1.5} />
                    </View>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureDescription}>{item.description}</Text>
                  </View>
                );
              }}
              keyExtractor={(item) => item.id.toString()}
            />

            <View style={styles.paginationContainer}>
              {FEATURES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === featureIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={nextStep}
              testID="continue-features-button"
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <User size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Faisons Connaissance</Text>
            <Text style={styles.stepSubtitle}>Votre coach a besoin de vous connaître</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Comment vous appelez-vous ?</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                testID="name-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Votre âge (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="Votre âge"
                placeholderTextColor={colors.textTertiary}
                value={age}
                onChangeText={(text) => {
                  const numValue = parseInt(text, 10);
                  if (text === '' || (numValue > 0 && numValue <= 120)) {
                    setAge(text);
                  }
                }}
                keyboardType="number-pad"
                testID="age-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Votre Rôle</Text>
              <View style={styles.levelsContainer}>
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.levelCard, isSelected && styles.levelCardSelected, { padding: 16, marginBottom: 8 }]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setRole(r.id);
                    }}
                    testID={`role-${r.id}`}
                  >
                    <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected, { fontSize: 16 }]}>
                      {r.label}
                    </Text>
                    <Text style={[styles.levelDesc, isSelected && styles.levelDescSelected, { fontSize: 12 }]}>
                      {r.desc}
                    </Text>
                    {isSelected && (
                      <View style={[styles.selectedBadge, { top: 12, right: 12 }]}>
                        <Check size={14} color={colors.primary} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={prevStep} testID="back-button">
                <Text style={styles.buttonSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, !name && styles.buttonDisabled]}
                onPress={nextStep}
                disabled={!name}
                testID="next-button"
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <Target size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Quels sont vos objectifs ?</Text>
            <Text style={styles.stepSubtitle}>Sélectionnez tout ce qui s&apos;applique</Text>

            <ScrollView style={styles.goalsContainer} showsVerticalScrollIndicator={false}>
              {GOALS_OPTIONS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                const IconComponent = goal.icon;
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                    onPress={() => toggleGoal(goal.id)}
                    testID={`goal-${goal.id}`}
                  >
                    <IconComponent
                      size={24}
                      color={isSelected ? colors.primary : colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>
                      {goal.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkIcon}>
                        <Check size={16} color={colors.primary} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={prevStep} testID="back-button">
                <Text style={styles.buttonSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, selectedGoals.length === 0 && styles.buttonDisabled]}
                onPress={nextStep}
                disabled={selectedGoals.length === 0}
                testID="next-button"
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <Activity size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Votre niveau de forme</Text>
            <Text style={styles.stepSubtitle}>Pour mieux personnaliser vos programmes</Text>

            <View style={styles.levelsContainer}>
              {FITNESS_LEVELS.map((level) => {
                const isSelected = fitnessLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.levelCard, isSelected && styles.levelCardSelected]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setFitnessLevel(level.id);
                    }}
                    testID={`fitness-${level.id}`}
                  >
                    <Text style={[styles.levelTitle, isSelected && styles.levelTitleSelected]}>
                      {level.label}
                    </Text>
                    <Text style={[styles.levelDesc, isSelected && styles.levelDescSelected]}>
                      {level.desc}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Check size={16} color={colors.primary} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonSecondary} onPress={prevStep} testID="back-button">
                <Text style={styles.buttonSecondaryText}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex]}
                onPress={nextStep}
                testID="next-button"
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
            <View style={styles.iconContainer}>
              <Bell size={64} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.stepTitle}>Restez Motivé</Text>
            <Text style={styles.stepSubtitle}>
              Activez les notifications pour recevoir des rappels de votre coach
            </Text>

            <View style={styles.permissionContainer}>
              <View style={styles.permissionCard}>
                <View style={styles.permissionIconWrapper}>
                  <Bell size={28} color={colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.permissionContent}>
                  <Text style={styles.permissionTitle}>Notifications</Text>
                  <Text style={styles.permissionDescription}>
                    Recevez des rappels et encouragements de votre coach IA
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Check size={20} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.benefitText}>Messages quotidiens personnalisés</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={20} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.benefitText}>Rappels d&apos;entraînement</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={20} color={colors.success} strokeWidth={2.5} />
                  <Text style={styles.benefitText}>Suivi de vos progrès</Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={async () => {
                  await handleComplete();
                }}
                testID="skip-permissions-button"
              >
                <Text style={styles.buttonSecondaryText}>Passer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonFlex, isCompleting && styles.buttonDisabled]}
                onPress={async () => {
                  try {
                    await requestPermission();
                    if (Platform.OS !== 'web') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                  } catch (error) {
                    console.error('Permission request failed:', error);
                  }
                  await handleComplete();
                }}
                disabled={isCompleting}
                testID="enable-notifications-button"
              >
                {isCompleting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.buttonText}>Activer & Terminer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  const insets = useSafeAreaInsets();
  const totalSteps = 6; // Steps count remains same as we added fields into existing step or modified existing
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {step > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {step} of {totalSteps - 1}
          </Text>
        </View>
      )}
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: "hidden" as const,
  },
  progressBarFill: {
    height: "100%" as const,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: "center" as const,
    marginVertical: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center" as const,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center" as const,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: "auto" as const,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  buttonRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: "auto" as const,
  },
  buttonSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  buttonSecondaryText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  buttonFlex: {
    flex: 1,
  },
  goalsContainer: {
    flex: 1,
    marginBottom: 16,
  },
  goalCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  goalText: {
    fontSize: 16,
    fontWeight: "500" as const,
    color: colors.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  goalTextSelected: {
    color: colors.primary,
    fontWeight: "600" as const,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  levelsContainer: {
    gap: 12,
    marginBottom: 16,
    flex: 1,
  },
  levelCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    position: "relative" as const,
  },
  levelCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  levelTitleSelected: {
    color: colors.primary,
  },
  levelDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  levelDescSelected: {
    color: colors.primaryLight,
  },
  selectedBadge: {
    position: "absolute" as const,
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 24,
  },
  welcomeIconContainer: {
    marginBottom: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: colors.text,
    textAlign: "center" as const,
    marginBottom: 16,
    lineHeight: 44,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 26,
  },
  featureList: {
    flex: 1,
    marginVertical: 24,
  },
  featureCard: {
    width: SCREEN_WIDTH - 48,
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  featureIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: colors.text,
    textAlign: "center" as const,
    marginBottom: 12,
  },
  featureDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center" as const,
    paddingVertical: 32,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  permissionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500" as const,
  },
});
