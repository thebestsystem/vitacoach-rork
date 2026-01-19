import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Share as ShareIcon, Trash2, Brain, TrendingUp, Lightbulb } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useJournalStore } from '@/stores/journalStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JournalEntryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getEntry, deleteEntry } = useJournalStore();

  const entry = getEntry(id as string);

  if (!entry) {
    return (
        <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.textSecondary }}>Entrée introuvable</Text>
            <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                <Text style={{ color: colors.primary }}>Retour</Text>
            </TouchableOpacity>
        </View>
    );
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = () => {
      deleteEntry(entry.id);
      router.back();
  };

  const handleShare = async () => {
      try {
          await Share.share({
              message: `Journal Reflection (${formatDate(entry.date)}):\n\n${entry.content}\n\nCoach Insight: ${entry.analysis?.summary || ''}`
          });
      } catch (error) {
          // ignore
      }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
                <ShareIcon size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>

        <View style={styles.contentCard}>
            <Text style={styles.content}>{entry.content}</Text>
        </View>

        {entry.analysis ? (
            <View style={styles.analysisContainer}>
                <View style={styles.analysisHeader}>
                    <Brain size={24} color={colors.primary} />
                    <Text style={styles.analysisTitle}>Analyse du Coach</Text>
                    {entry.analysis.strategic_score && (
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreText}>{entry.analysis.strategic_score}/10</Text>
                        </View>
                    )}
                </View>

                <Text style={styles.summary}>{entry.analysis.summary}</Text>

                <View style={styles.section}>
                    <View style={styles.sectionTitleRow}>
                        <Lightbulb size={18} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>Insights Clés</Text>
                    </View>
                    {entry.analysis.key_insights.map((insight, idx) => (
                        <View key={idx} style={styles.bulletPoint}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>{insight}</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.section, styles.adviceSection]}>
                    <View style={styles.sectionTitleRow}>
                        <TrendingUp size={18} color="#10B981" />
                        <Text style={styles.sectionTitle}>Conseil Actionnable</Text>
                    </View>
                    <Text style={styles.adviceText}>{entry.analysis.actionable_advice}</Text>
                </View>
            </View>
        ) : (
            <View style={styles.pendingAnalysis}>
                <Text style={styles.pendingText}>Pas d'analyse disponible pour cette entrée.</Text>
            </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  headerActions: {
      flexDirection: 'row',
      gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  scrollContent: {
      padding: 20,
  },
  date: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 16,
      textTransform: 'capitalize',
  },
  contentCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
  },
  content: {
      fontSize: 18,
      color: colors.text,
      lineHeight: 28,
  },
  analysisContainer: {
      gap: 20,
  },
  analysisHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
  },
  analysisTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
  },
  scoreBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
  },
  scoreText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
  },
  summary: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      fontStyle: 'italic',
      opacity: 0.9,
  },
  section: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 16,
  },
  sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
  },
  bulletPoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 8,
  },
  bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textSecondary,
      marginTop: 8,
  },
  bulletText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
  },
  adviceSection: {
      backgroundColor: '#ECFDF5', // Light green
  },
  adviceText: {
      fontSize: 16,
      color: '#065F46', // Dark green
      fontWeight: '500',
      lineHeight: 24,
  },
  pendingAnalysis: {
      padding: 20,
      alignItems: 'center',
  },
  pendingText: {
      color: colors.textSecondary,
  },
});
