import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Sparkles, Send, Mic, Square } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useJournalStore } from '@/stores/journalStore';
import { useGoalStore } from '@/stores/goalStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBaseUrl } from '@/utils/baseUrl';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import * as Haptics from 'expo-haptics';

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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(PROMPTS[0]);

  const { isRecording, startRecording, stopRecording, durationMillis } = useVoiceRecorder();

  const handleToggleRecording = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        handleTranscribe(uri);
      }
    } else {
      await startRecording();
    }
  };

  const handleTranscribe = async (uri: string) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${getBaseUrl()}/api/transcribe`, {
        method: 'POST',
        body: formData,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      if (data.text) {
        setContent(prev => (prev ? prev + '\n\n' + data.text : data.text));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert('Erreur', "La transcription a échoué. Vérifiez votre connexion.");
      console.error(error);
    } finally {
      setIsTranscribing(false);
    }
  };

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

  const formatDuration = (millis: number) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            disabled={!content.trim() || isAnalyzing || isRecording}
            style={[styles.saveButton, (!content.trim() || isAnalyzing || isRecording) && styles.saveButtonDisabled]}
        >
            {isAnalyzing ? (
                <ActivityIndicator color={colors.surface} size="small" />
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
                    placeholder={isTranscribing ? "Transcription en cours..." : "Commencez à écrire ou dictez..."}
                    placeholderTextColor={colors.textTertiary}
                    value={content}
                    onChangeText={setContent}
                    textAlignVertical="top"
                    editable={!isTranscribing}
                />

                <View style={styles.toolbar}>
                    <TouchableOpacity
                        style={[styles.micButton, isRecording && styles.micButtonRecording]}
                        onPress={handleToggleRecording}
                        disabled={isTranscribing}
                    >
                        {isRecording ? (
                            <Square size={24} color={colors.surface} fill={colors.surface} />
                        ) : (
                            <Mic size={24} color={isTranscribing ? colors.textTertiary : colors.surface} />
                        )}
                    </TouchableOpacity>
                    {isRecording && (
                        <Text style={styles.recordingTimer}>{formatDuration(durationMillis)}</Text>
                    )}
                    {isTranscribing && (
                        <View style={styles.transcribingContainer}>
                             <ActivityIndicator size="small" color={colors.primary} />
                             <Text style={styles.transcribingText}>Transcription IA...</Text>
                        </View>
                    )}
                </View>
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
    minWidth: 100,
    alignItems: 'center',
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
  toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 20,
      gap: 12,
  },
  micButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  micButtonRecording: {
      backgroundColor: colors.error,
      shadowColor: colors.error,
  },
  recordingTimer: {
      fontSize: 16,
      fontVariant: ['tabular-nums'],
      color: colors.error,
      fontWeight: '600',
  },
  transcribingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
  },
  transcribingText: {
      fontSize: 14,
      color: colors.textSecondary,
  }
});
