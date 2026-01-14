import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, Square, Clock, Zap, Coffee, Brain, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useFocusStore, FocusMode } from '@/stores/focusStore';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.7;

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { status, timeLeft, mode, setMode, startFocus, pauseFocus, resumeFocus, stopFocus, tick, history } = useFocusStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'focusing') {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, tick]);

  // Handle app state changes (background/foreground) to update timer instantly
  // In a real implementation, we could also use useKeepAwake() here if desired.

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (status === 'focusing') {
      pauseFocus();
    } else if (status === 'paused') {
      resumeFocus();
    } else {
      startFocus();
    }
  };

  const handleStop = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    stopFocus();
  };

  const getModeIcon = (m: FocusMode) => {
    switch (m) {
      case 'deep': return Brain;
      case 'pomodoro': return Clock;
      case 'shallow': return Coffee;
    }
  };

  const getModeLabel = (m: FocusMode) => {
    switch (m) {
      case 'deep': return 'Deep Work';
      case 'pomodoro': return 'Pomodoro';
      case 'shallow': return 'Quick Focus';
    }
  };

  // Calculate today's focus time
  const todayFocusTime = React.useMemo(() => {
      const startOfDay = new Date();
      startOfDay.setHours(0,0,0,0);
      return history
          .filter(session => session.endTime > startOfDay.getTime())
          .reduce((acc, session) => acc + session.duration, 0);
  }, [history]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={[colors.background, colors.backgroundSecondary]}
        style={[styles.background, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mode Concentration</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>

          {/* Mode Selector */}
          <View style={styles.modeContainer}>
            {(['deep', 'pomodoro', 'shallow'] as FocusMode[]).map((m) => {
              const Icon = getModeIcon(m);
              const isActive = mode === m;
              const labels = {
                deep: 'Travail Profond',
                pomodoro: 'Pomodoro',
                shallow: 'Rapide'
              };
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeButton, isActive && styles.modeButtonActive]}
                  onPress={() => {
                    if (status === 'idle') {
                        Haptics.selectionAsync();
                        setMode(m);
                    }
                  }}
                  disabled={status !== 'idle'}
                >
                  <Icon size={20} color={isActive ? colors.surface : colors.textSecondary} />
                  <Text style={[styles.modeText, isActive && styles.modeTextActive]}>
                    {labels[m]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerCircle}>
               <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.timerGradient}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
               >
                 <View style={styles.timerInner}>
                    <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerLabel}>{status === 'focusing' ? 'EN COURS' : status === 'paused' ? 'PAUSE' : 'PRÊT'}</Text>
                 </View>
               </LinearGradient>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsContainer}>
            {status !== 'idle' && (
               <TouchableOpacity style={styles.secondaryControl} onPress={handleStop}>
                 <Square size={24} color={colors.error} fill={colors.error} />
               </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.mainControl} onPress={handleToggle}>
               {status === 'focusing' ? (
                   <Pause size={32} color={colors.surface} fill={colors.surface} />
               ) : (
                   <Play size={32} color={colors.surface} fill={colors.surface} style={{ marginLeft: 4 }} />
               )}
            </TouchableOpacity>

            {status !== 'idle' && <View style={{ width: 56 }} />}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
             <View style={styles.statCard}>
                <Zap size={20} color={colors.warning} />
                <View>
                    <Text style={styles.statValue}>{Math.floor(todayFocusTime / 60)}m</Text>
                    <Text style={styles.statLabel}>Focus du jour</Text>
                </View>
             </View>
             <View style={styles.statCard}>
                <CheckCircle2 size={20} color={colors.success} />
                <View>
                    <Text style={styles.statValue}>{history.filter(h => h.completed).length}</Text>
                    <Text style={styles.statLabel}>Sessions finies</Text>
                </View>
             </View>
          </View>

          {/* Binaural Beats (Mock) */}
          <TouchableOpacity style={styles.binauralCard}>
              <View style={styles.binauralInfo}>
                  <Text style={styles.binauralTitle}>Sons Binauraux</Text>
                  <Text style={styles.binauralSubtitle}>40Hz pour Concentration Profonde</Text>
              </View>
              <View style={styles.binauralToggle}>
                 <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Bientôt</Text>
              </View>
          </TouchableOpacity>

        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: 16,
    marginBottom: 40,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modeTextActive: {
    color: colors.surface,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  timerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timerGradient: {
    flex: 1,
    borderRadius: CIRCLE_SIZE / 2,
    padding: 4,
  },
  timerInner: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: (CIRCLE_SIZE - 8) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 8,
    letterSpacing: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 32,
  },
  mainControl: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secondaryControl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  binauralCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
  },
  binauralInfo: {
    flex: 1,
  },
  binauralTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  binauralSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  binauralToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
  },
});
