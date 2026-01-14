import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sun, Battery, Brain, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHealth } from '@/contexts/HealthContext';
import { useGamification } from '@/contexts/GamificationContext';
import { useFocusStore } from '@/stores/focusStore';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface MorningBriefingProps {
  visible: boolean;
  onClose: () => void;
}

export function MorningBriefing({ visible, onClose }: MorningBriefingProps) {
  const { userProfile, healthMetrics, coachPlaybook } = useHealth();
  const { streaks } = useGamification();
  const { mode } = useFocusStore();

  const [step, setStep] = useState(0);
  const [insight, setInsight] = useState<string>("");

  useEffect(() => {
    if (visible) {
      generateInsight();
      setStep(0);
    }
  }, [visible]);

  const generateInsight = () => {
    const sleep = healthMetrics?.sleep || 0;
    const steps = healthMetrics?.steps || 0;

    if (sleep > 7) {
      setInsight("Your recovery is optimal. This is a prime day for deep work and high-output tasks.");
    } else if (sleep > 5) {
      setInsight("Recovery is moderate. Prioritize your most important task early, then switch to administrative work.");
    } else {
      setInsight("Recovery is low. Focus on maintenance tasks today and ensure you get to bed early.");
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  const workoutStreak = streaks.find(s => s.type === 'workout')?.current || 0;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.container}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
           {[0, 1, 2].map((i) => (
             <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
           ))}
        </View>

        <View style={styles.content}>

          {step === 0 && (
            <View style={styles.slide}>
              <View style={styles.iconContainer}>
                 <Sun size={48} color={colors.warning} />
              </View>
              <Text style={styles.title}>Good Morning, {userProfile?.name || "Founder"}</Text>
              <Text style={styles.subtitle}>Let's calibrate your operating system for the day.</Text>

              <View style={styles.statRow}>
                 <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Weather</Text>
                    <Text style={styles.statValue}>22° Sunny</Text>
                 </View>
                 <View style={styles.divider} />
                 <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Events</Text>
                    <Text style={styles.statValue}>3 Scheduled</Text>
                 </View>
              </View>
            </View>
          )}

          {step === 1 && (
             <View style={styles.slide}>
               <View style={styles.iconContainer}>
                 <Battery size={48} color={colors.success} />
               </View>
               <Text style={styles.title}>System Status</Text>

               <View style={styles.metricsContainer}>
                 <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                       <Brain size={20} color={colors.primary} />
                       <Text style={styles.metricTitle}>Recovery</Text>
                    </View>
                    <Text style={styles.metricValue}>{(healthMetrics?.sleep || 0) >= 7 ? 'Optimal' : 'Moderate'}</Text>
                    <Text style={styles.metricSub}>{healthMetrics?.sleep || 0}h Sleep</Text>
                 </View>

                 <View style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                       <TrendingUp size={20} color={colors.accent} />
                       <Text style={styles.metricTitle}>Momentum</Text>
                    </View>
                    <Text style={styles.metricValue}>{workoutStreak} Days</Text>
                    <Text style={styles.metricSub}>Active Streak</Text>
                 </View>
               </View>

               <Text style={styles.insightText}>"{insight}"</Text>
             </View>
          )}

          {step === 2 && (
             <View style={styles.slide}>
                <View style={styles.iconContainer}>
                   <CheckCircle2 size={48} color={colors.primary} />
                </View>
                <Text style={styles.title}>Mission Accepted</Text>
                <Text style={styles.subtitle}>Your top priorities are locked in.</Text>

                <View style={styles.missionList}>
                   {coachPlaybook?.focusAreas && coachPlaybook.focusAreas.length > 0 ? (
                      coachPlaybook.focusAreas.slice(0, 3).map((area, idx) => (
                        <View key={idx} style={styles.missionItem}>
                            <View style={styles.missionBullet} />
                            <Text style={styles.missionText}>{area}</Text>
                        </View>
                      ))
                   ) : (
                      <>
                        <View style={styles.missionItem}>
                            <View style={styles.missionBullet} />
                            <Text style={styles.missionText}>Deep Work ({mode === 'pomodoro' ? '25m' : '90m'})</Text>
                        </View>
                        <View style={styles.missionItem}>
                            <View style={styles.missionBullet} />
                            <Text style={styles.missionText}>Workout (Zone 2)</Text>
                        </View>
                        <View style={styles.missionItem}>
                            <View style={styles.missionBullet} />
                            <Text style={styles.missionText}>Review KPIs</Text>
                        </View>
                      </>
                   )}
                </View>
             </View>
          )}

        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
           <LinearGradient
             colors={[colors.primary, colors.accent]}
             start={{ x: 0, y: 0 }}
             end={{ x: 1, y: 0 }}
             style={styles.buttonGradient}
           >
              <Text style={styles.buttonText}>{step === 2 ? "Initiate Day" : "Next"}</Text>
              <ArrowRight size={20} color="#FFF" />
           </LinearGradient>
        </TouchableOpacity>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  progressContainer: {
    position: 'absolute',
    top: 60,
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  slide: {
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 26,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  insightText: {
    fontSize: 16,
    color: '#FFF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  missionList: {
    width: '100%',
    gap: 16,
  },
  missionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  missionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 16,
  },
  missionText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  button: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
});
