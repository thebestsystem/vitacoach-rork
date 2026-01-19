import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Send } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useJournalStore } from '@/stores/journalStore';
import { useGoalStore } from '@/stores/goalStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBaseUrl } from '@/utils/baseUrl';

const PROMPTS = [
  "Quelle a été votre plus grande victoire aujourd'hui ?",
  "Quel obstacle avez-vous rencontré et comment l'avez-vous surmonté ?",
  "Qu'avez-vous appris sur vous-même aujourd'hui ?",
  "Si vous pouviez recommencer la journée, que changeriez-vous ?",
  "De quoi êtes-vous reconnaissant en ce moment ?"
];

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addEntry } = useJournalStore();
  const { goals } = useGoalStore();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0]);

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsAnalyzing(true);
    try {
      // Prepare context with active goals
      const activeGoals = goals.filter(g => g.status === 'active').map(g => ({
        title: g.title,
        description: g.description,
        deadline: g.deadline
      }));

      // Optimistic save first, analysis later? No, let's wait for analysis to be impressive.
      // But if it fails, we still save content.

      let analysisResult = null;

      try {
        const response = await fetch(`${getBaseUrl()}/api/analyze-journal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content,
              context: { goals: activeGoals }
            }),
        });

        if (response.ok) {
            analysisResult = await response.json();
        }
      } catch (e) {
        console.error("Analysis failed", e);
        // Silently fail analysis, just save text
      }

      addEntry({
        content,
        tags: analysisResult?.tags || [],
        sentiment: analysisResult?.sentiment,
        analysis: analysisResult ? {
            summary: analysisResult.summary,
            key_insights: analysisResult.key_insights,
            actionable_advice: analysisResult.actionable_advice,
            strategic_score: analysisResult.strategic_score
        } : undefined
      });

      router.back();

    } catch (error) {
      Alert.alert("Erreur", "Impossible de sauvegarder l'entrée.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle Réflexion</Text>
        <TouchableOpacity
            onPress={handleSave}
            disabled={!content.trim() || isAnalyzing}
            style={[styles.saveButton, (!content.trim() || isAnalyzing) && styles.saveButtonDisabled]}
        >
            {isAnalyzing ? (
                <Text style={styles.saveButtonText}>Analyse...</Text>
            ) : (
                <Text style={styles.saveButtonText}>Enregistrer</Text>
            )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
            <Text style={styles.promptLabel}>Suggestion de réflexion :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.promptsContainer}>
                {PROMPTS.map((prompt, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.promptCard,
                            selectedPrompt === prompt && styles.promptCardActive
                        ]}
                        onPress={() => setSelectedPrompt(prompt)}
                    >
                        <Text style={[
                            styles.promptText,
                            selectedPrompt === prompt && styles.promptTextActive
                        ]}>{prompt}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.editorContainer}>
                <Text style={styles.selectedPrompt}>{selectedPrompt}</Text>
                <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Commencez à écrire..."
                    placeholderTextColor={colors.textTertiary}
                    value={content}
                    onChangeText={setContent}
                    autoFocus
                    textAlignVertical="top"
                />
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  promptLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  promptsContainer: {
    flexGrow: 0,
    marginBottom: 24,
  },
  promptCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: 250,
  },
  promptCardActive: {
    backgroundColor: colors.primary + '15', // 15% opacity
    borderColor: colors.primary,
  },
  promptText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  promptTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    minHeight: 400,
  },
  selectedPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    opacity: 0.8,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    flex: 1,
  },
});
