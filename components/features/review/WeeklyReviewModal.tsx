import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ChevronRight, ChevronLeft, Check, Star, TrendingUp, Zap, Target, Brain } from 'lucide-react-native';
import colors from '@/constants/colors';
import { selectionFeedback, successFeedback } from '@/utils/haptics';
import { useReviewStore } from '@/stores/reviewStore';
import { useJournalStore } from '@/stores/journalStore';
import { useHealth } from '@/contexts/HealthContext'; // For user profile/ID

interface WeeklyReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 'intro', title: 'Bilan Hebdomadaire' },
  { id: 'reflection', title: 'Réflexion' },
  { id: 'scoring', title: 'Métriques' },
  { id: 'planning', title: 'Cap Stratégique' },
  { id: 'summary', title: 'Analyse IA' },
];

export function WeeklyReviewModal({ visible, onClose }: WeeklyReviewModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedFeedback, setGeneratedFeedback] = useState<string | null>(null);
  const [strategicScore, setStrategicScore] = useState<number | null>(null);

  const { userProfile } = useHealth();
  const { addReview } = useReviewStore();
  const { entries } = useJournalStore();

  // Form State
  const [wins, setWins] = useState('');
  const [improvements, setImprovements] = useState('');
  const [lessons, setLessons] = useState('');
  const [priorities, setPriorities] = useState('');

  const [scores, setScores] = useState({
    productivity: 7,
    energy: 7,
    clarity: 7,
  });

  const resetForm = () => {
    setCurrentStep(0);
    setWins('');
    setImprovements('');
    setLessons('');
    setPriorities('');
    setScores({ productivity: 7, energy: 7, clarity: 7 });
    setGeneratedFeedback(null);
    setStrategicScore(null);
  };

  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  const handleNext = () => {
    selectionFeedback();
    if (currentStep < STEPS.length - 1) {
      if (currentStep === 3) {
        // Submitting for AI Analysis
        handleSubmitAndAnalyze();
      } else {
        setCurrentStep(c => c + 1);
      }
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    selectionFeedback();
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    } else {
      onClose();
    }
  };

  const handleSubmitAndAnalyze = async () => {
    setIsSubmitting(true);

    // Get recent journal entries for context
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentEntries = entries.filter(e => new Date(e.date) >= oneWeekAgo);
    const journalSummaries = recentEntries.map(e => e.summary || e.content.substring(0, 100)).join('\n');

    try {
        // 1. Call AI
        const response = await fetch('/api/analyze-weekly-review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wins,
                improvements,
                lessons,
                prioritiesNextWeek: priorities,
                journalSummaries,
                userContext: { name: userProfile?.name }
            })
        });

        if (!response.ok) throw new Error('AI Analysis failed');
        const data = await response.json();

        setGeneratedFeedback(data.coachFeedback);
        setStrategicScore(data.strategicAlignmentScore);

        // 2. Save to Firestore
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        monday.setHours(0,0,0,0);

        const reviewData = {
            userId: userProfile?.uid || 'anonymous',
            weekStartDate: monday.toISOString(),
            weekEndDate: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            wins,
            improvements,
            lessons,
            productivityScore: scores.productivity,
            energyScore: scores.energy,
            clarityScore: scores.clarity,
            prioritiesNextWeek: priorities,
            aiFeedback: data.coachFeedback,
            status: 'completed' as const
        };

        await addReview(reviewData);
        successFeedback();
        setCurrentStep(c => c + 1);

    } catch (e) {
        console.error(e);
        Alert.alert("Erreur", "Impossible de sauvegarder le bilan. Veuillez réessayer.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderScoreSlider = (label: string, value: number, onChange: (v: number) => void, icon: any) => (
    <View style={styles.scoreContainer}>
      <View style={styles.scoreHeader}>
        <View style={styles.scoreLabelRow}>
            {icon}
            <Text style={styles.scoreLabel}>{label}</Text>
        </View>
        <Text style={styles.scoreValue}>{value}/10</Text>
      </View>
      <View style={styles.sliderTrack}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <TouchableOpacity
                key={num}
                style={[styles.sliderStep, num <= value && styles.sliderStepActive]}
                onPress={() => {
                    selectionFeedback();
                    onChange(num);
                }}
            />
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 0: // Intro
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconCircle}>
                <Target size={40} color={colors.primary} />
            </View>
            <Text style={styles.stepTitle}>Le Moment de Vérité</Text>
            <Text style={styles.stepDescription}>
              "Ce qui ne se mesure pas ne s'améliore pas."{'\n\n'}
              Prenons 5 minutes pour analyser votre semaine, célébrer vos victoires et calibrer votre boussole pour la semaine à venir.
            </Text>
          </View>
        );

      case 1: // Reflection
        return (
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.stepTitle}>Rétrospective</Text>

            <Text style={styles.inputLabel}>🏆 Vos 3 plus grandes victoires</Text>
            <TextInput
                style={styles.textArea}
                multiline
                placeholder="J'ai réussi à..."
                placeholderTextColor={colors.textTertiary}
                value={wins}
                onChangeText={setWins}
            />

            <Text style={styles.inputLabel}>🚧 Ce qui aurait pu être mieux</Text>
            <TextInput
                style={styles.textArea}
                multiline
                placeholder="J'ai perdu du temps sur..."
                placeholderTextColor={colors.textTertiary}
                value={improvements}
                onChangeText={setImprovements}
            />

            <Text style={styles.inputLabel}>💡 Une leçon apprise</Text>
            <TextInput
                style={styles.textArea}
                multiline
                placeholder="J'ai réalisé que..."
                placeholderTextColor={colors.textTertiary}
                value={lessons}
                onChangeText={setLessons}
            />
          </ScrollView>
        );

      case 2: // Scoring
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.stepTitle}>Métriques Clés</Text>
                <Text style={styles.stepDescription}>Évaluez votre performance subjective.</Text>

                <View style={{ gap: 24, width: '100%', marginTop: 20 }}>
                    {renderScoreSlider("Productivité", scores.productivity, (v) => setScores({...scores, productivity: v}), <TrendingUp size={18} color={colors.text} />)}
                    {renderScoreSlider("Énergie", scores.energy, (v) => setScores({...scores, energy: v}), <Zap size={18} color={colors.text} />)}
                    {renderScoreSlider("Clarté Mentale", scores.clarity, (v) => setScores({...scores, clarity: v}), <Brain size={18} color={colors.text} />)}
                </View>
            </View>
        );

      case 3: // Planning
        return (
            <ScrollView style={styles.scrollContainer}>
                <Text style={styles.stepTitle}>Cap Stratégique</Text>
                <Text style={styles.stepDescription}>Quelles sont les 3 priorités absolues pour la semaine prochaine ? Si vous ne faites que ça, la semaine sera réussie.</Text>

                <TextInput
                    style={[styles.textArea, { minHeight: 150 }]}
                    multiline
                    placeholder="- Lancer le projet X..."
                    placeholderTextColor={colors.textTertiary}
                    value={priorities}
                    onChangeText={setPriorities}
                />
            </ScrollView>
        );

        case 4: // Summary & AI
            return (
                <ScrollView style={styles.scrollContainer}>
                    <View style={styles.aiHeader}>
                        <View style={styles.aiBadge}>
                            <Text style={styles.aiBadgeText}>{strategicScore}% ALIGNEMENT</Text>
                        </View>
                    </View>

                    <Text style={styles.stepTitle}>Le Feedback de Vita</Text>

                    <View style={styles.feedbackCard}>
                        <Text style={styles.feedbackText}>{generatedFeedback}</Text>
                    </View>

                    <Text style={styles.subHeader}>Vos Priorités</Text>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>{priorities}</Text>
                    </View>
                </ScrollView>
            );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
        <BlurView intensity={Platform.OS === 'ios' ? 40 : 100} tint="dark" style={styles.absolute} />
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? "padding" : "height"}
            style={styles.container}
        >
            <SafeAreaView style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.closeButton}>
                        {currentStep > 0 ? <ChevronLeft color={colors.text} size={24} /> : <X color={colors.text} size={24} />}
                    </TouchableOpacity>
                    <View style={styles.progressBar}>
                        {STEPS.map((step, idx) => (
                            <View
                                key={step.id}
                                style={[
                                    styles.progressDot,
                                    idx <= currentStep && styles.progressDotActive,
                                    idx === currentStep && styles.progressDotCurrent
                                ]}
                            />
                        ))}
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.body}>
                    {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Analyse de votre semaine...</Text>
                        </View>
                    ) : renderContent()}
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.mainButton}
                        onPress={handleNext}
                        disabled={isSubmitting}
                    >
                        <Text style={styles.mainButtonText}>
                            {currentStep === STEPS.length - 1 ? "Terminer" : (currentStep === 3 ? "Analyser" : "Suivant")}
                        </Text>
                        {currentStep < STEPS.length - 1 && <ChevronRight color={colors.surface} size={20} />}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  absolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 40, // visual gap from top
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressDotCurrent: {
    width: 20,
  },
  body: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  mainButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.surface,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  scoreContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 30,
    alignItems: 'center',
  },
  sliderStep: {
    width: '8%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
  },
  sliderStepActive: {
    backgroundColor: colors.primary,
    height: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  feedbackCard: {
    backgroundColor: `${colors.primary}10`,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
  },
  summaryText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
