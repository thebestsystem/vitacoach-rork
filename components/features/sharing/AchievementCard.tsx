import React from 'react';
import { View, Text, StyleSheet, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Medal, Target, TrendingUp, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';

interface AchievementCardProps {
  title: string;
  subtitle?: string;
  stat?: string;
  userName: string;
  type: 'challenge' | 'rank' | 'milestone';
  icon?: string; // Emoji or specific icon identifier
  date?: string;
}

export const AchievementCard = React.forwardRef<View, AchievementCardProps>(({
  title,
  subtitle,
  stat,
  userName,
  type,
  icon,
  date = new Date().toLocaleDateString()
}, ref) => {

  const getIcon = () => {
    switch(type) {
      case 'challenge': return <Trophy size={48} color={colors.surface} strokeWidth={1.5} />;
      case 'rank': return <Medal size={48} color="#FFD700" strokeWidth={1.5} />;
      default: return <Sparkles size={48} color={colors.surface} strokeWidth={1.5} />;
    }
  };

  const getGradient = () => {
     switch(type) {
         case 'rank': return [colors.gradient1[0], colors.gradient1[1]] as const;
         case 'challenge': return [colors.gradient2[0], colors.gradient2[1]] as const;
         default: return [colors.primary, colors.secondary] as const;
     }
  };

  return (
    <View ref={ref} style={styles.container}>
      <LinearGradient
        colors={getGradient()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.patternOverlay} />

        {/* Header */}
        <View style={styles.header}>
            <View style={styles.logoContainer}>
                 <Text style={styles.logoText}>VITA OS</Text>
            </View>
            <Text style={styles.date}>{date}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
            <View style={styles.iconCircle}>
                 {icon ? <Text style={{fontSize: 40}}>{icon}</Text> : getIcon()}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.preTitle}>{type === 'challenge' ? 'CHALLENGE COMPLETED' : 'NEW ACHIEVEMENT'}</Text>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>

            {stat && (
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{stat}</Text>
                </View>
            )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
             <View style={styles.userRow}>
                 <View style={styles.avatarPlaceholder}>
                     <Text style={styles.avatarLetter}>{userName.charAt(0)}</Text>
                 </View>
                 <Text style={styles.userName}>{userName}</Text>
             </View>
             <Text style={styles.brandTag}>#HighPerformance</Text>
        </View>

      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 350,
    height: 500, // Instagram Story Ratio is 9:16, but for card usually 4:5 or similar is good. 350x500 is good.
    backgroundColor: colors.background,
    overflow: 'hidden',
    // Position absolute usually handled by parent for hidden render, but here we just style the box.
  },
  gradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    backgroundColor: '#000', // Could implement a pattern via SVG if needed, simple overlay for now
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  logoText: {
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 12,
  },
  date: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 10,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  preTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  statBox: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  brandTag: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
});
