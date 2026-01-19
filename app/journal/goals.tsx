import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Trash2, CheckCircle, Circle, Archive } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useGoalStore } from '@/stores/goalStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goals, addGoal, deleteGoal, toggleStatus } = useGoalStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');

  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    addGoal({
      title: newGoalTitle,
      description: newGoalDescription,
      category: 'business', // Default for now
      status: 'active',
    });

    setNewGoalTitle('');
    setNewGoalDescription('');
    setIsAdding(false);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Objectifs Stratégiques</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Plus size={24} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>Définissez votre "North Star". Ces objectifs guideront l'analyse de votre journal.</Text>

          {isAdding && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>Nouvel Objectif</Text>
              <TextInput
                style={styles.input}
                placeholder="Titre de l'objectif (ex: Lancer le MVP)"
                placeholderTextColor={colors.textTertiary}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
                autoFocus
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description / Key Results..."
                placeholderTextColor={colors.textTertiary}
                value={newGoalDescription}
                onChangeText={setNewGoalDescription}
                multiline
              />
              <View style={styles.formButtons}>
                <TouchableOpacity onPress={() => setIsAdding(false)} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddGoal} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>En cours ({activeGoals.length})</Text>
            {activeGoals.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Aucun objectif actif.</Text>
                </View>
            ) : (
                activeGoals.map((goal) => (
                <View key={goal.id} style={styles.goalCard}>
                    <TouchableOpacity onPress={() => toggleStatus(goal.id, 'completed')}>
                    <Circle size={24} color={colors.textTertiary} />
                    </TouchableOpacity>
                    <View style={styles.goalInfo}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert("Supprimer", "Êtes-vous sûr ?", [{ text: "Annuler" }, { text: "Oui", onPress: () => deleteGoal(goal.id) }])}>
                    <Trash2 size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
                ))
            )}
          </View>

          {completedGoals.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terminés</Text>
              {completedGoals.map((goal) => (
                <View key={goal.id} style={[styles.goalCard, styles.goalCardCompleted]}>
                  <TouchableOpacity onPress={() => toggleStatus(goal.id, 'active')}>
                    <CheckCircle size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalTitle, styles.textCompleted]}>{goal.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  goalCardCompleted: {
    opacity: 0.6,
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  goalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  textCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  emptyStateText: {
    color: colors.textTertiary,
  },
  addForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 12,
    color: colors.text,
    marginBottom: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  submitButtonText: {
    color: colors.surface,
    fontWeight: '600',
  },
});
