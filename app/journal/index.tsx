import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, ChevronLeft, Calendar, Brain, ArrowUpRight } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useJournalStore } from '@/stores/journalStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JournalListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { entries } = useJournalStore();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#4ADE80';
      case 'negative': return '#EF4444';
      case 'mixed': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Journal Stratégique</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {entries.length === 0 ? (
            <View style={styles.emptyState}>
                <Brain size={64} color={colors.primary} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyTitle}>Votre espace de réflexion</Text>
                <Text style={styles.emptyText}>Capturez vos pensées, victoires et défis. L'IA analysera vos entrées pour vous coacher.</Text>
                <TouchableOpacity
                  style={styles.createButtonLarge}
                  onPress={() => router.push('/journal/new' as any)}
                >
                    <Text style={styles.createButtonText}>Première Entrée</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.entriesList}>
                {entries.map((entry) => (
                    <TouchableOpacity
                        key={entry.id}
                        style={styles.entryCard}
                        onPress={() => router.push(`/journal/${entry.id}` as any)}
                    >
                        <View style={styles.entryHeader}>
                            <View style={styles.dateContainer}>
                                <Calendar size={14} color={colors.textSecondary} />
                                <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
                            </View>
                            {entry.sentiment && (
                                <View style={[styles.sentimentDot, { backgroundColor: getSentimentColor(entry.sentiment) }]} />
                            )}
                        </View>
                        <Text style={styles.entryPreview} numberOfLines={2}>{entry.content}</Text>

                        {entry.analysis && (
                            <View style={styles.analysisPreview}>
                                <Brain size={14} color={colors.primary} />
                                <Text style={styles.analysisText} numberOfLines={1}>
                                    {entry.analysis.summary}
                                </Text>
                            </View>
                        )}

                        <View style={styles.tagsContainer}>
                            {entry.tags?.slice(0, 3).map((tag, idx) => (
                                <View key={idx} style={styles.tag}>
                                    <Text style={styles.tagText}>#{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        )}
      </ScrollView>

      {entries.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 20 }]}
            onPress={() => router.push('/journal/new' as any)}
          >
            <Plus size={32} color={colors.surface} />
          </TouchableOpacity>
      )}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  createButtonLarge: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  createButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  entriesList: {
    gap: 16,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryPreview: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  analysisPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  analysisText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
