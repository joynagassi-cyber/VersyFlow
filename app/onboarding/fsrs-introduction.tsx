/**
 * FSRS Introduction Screen
 * See Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow?node-id=7-50
 *
 * This screen introduces the FSRS (Free Spaced Repetition Scheduler) algorithm
 * with a visual graph and key benefits.
 */

import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '@/store/settings-store';

export default function FSRSIntroductionScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();

  const handleStartMemorization = () => {
    // Complete onboarding and go to home
    useSettingsStore.getState().completeOnboarding();
    router.replace('/(tabs)/index');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="brain" size={33} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            La science de la mémorisation
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            Découvrez FSRS : un algorithme intelligent qui s'adapte à votre cerveau pour une mémorisation durable des Écritures.
          </Text>
        </View>

        {/* Visual Graph Section */}
        <View style={styles.graphSection}>
          <View style={styles.graphCard}>
            {/* Y-axis labels */}
            <View style={styles.yAxisContainer}>
              <Text style={styles.yAxisLabel}>100%</Text>
              <Text style={styles.yAxisLabel}>50%</Text>
              <Text style={styles.yAxisLabel}>0%</Text>
            </View>

            {/* Graph placeholder - in production, this would be an SVG or Chart component */}
            <View style={styles.graphArea}>
              <View style={styles.gridLines}>
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
                <View style={styles.gridLine} />
              </View>

              {/* SVG graph would go here */}
              <View style={styles.graphPlaceholder}>
                {/* This represents the retention curve visualization */}
                <View style={styles.retentionCurve} />
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxisContainer}>
                <Text style={styles.xAxisLabel}>Jour 1</Text>
                <Text style={styles.xAxisLabel}>Jour 7</Text>
                <Text style={styles.xAxisLabel}>Mois 1</Text>
              </View>
            </View>

            {/* Legend overlay */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Rétention Optimale</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendDotDashed]} />
                <Text style={styles.legendTextSecondary}>Oubli Naturel</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Benefits List Section */}
        <View style={styles.benefitsSection}>
          {/* Benefit 1: Rythme optimal */}
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: colors.primaryFixed }]}>
              <Ionicons name="timer" size={21} color={colors.primary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Rythme optimal</Text>
              <Text style={styles.benefitDescription}>
                Révisez chaque verset juste avant de l'oublier, maximisant la rétention avec un effort minimal.
              </Text>
            </View>
          </View>

          {/* Benefit 2: Moins de révisions */}
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: colors.iconBgPurple }]}>
              <Ionicons name="checkmark-done" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Moins de révisions</Text>
              <Text style={styles.benefitDescription}>
                Ne perdez pas de temps sur ce que vous savez déjà. Concentrez-vous sur ce qui nécessite votre attention.
              </Text>
            </View>
          </View>

          {/* Benefit 3: Scientifiquement prouvé */}
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIcon, { backgroundColor: colors.success }]}>
              <Ionicons name="flask" size={18} color={colors.surface} />
            </View>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Scientifiquement prouvé</Text>
              <Text style={styles.benefitDescription}>
                Basé sur la recherche cognitive avancée (Free Spaced Repetition Scheduler).
              </Text>
            </View>
          </View>
        </View>

        {/* Spacer for bottom bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartMemorization}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Commencer à mémoriser</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 34,
    height: 36,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 24,
  },

  // Graph Section
  graphSection: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  graphCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    height: 280,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 32,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  yAxisContainer: {
    position: 'absolute',
    left: 12,
    top: 20,
    bottom: 60,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Nimbus Sans',
  },
  graphArea: {
    flex: 1,
    marginTop: 8,
    position: 'relative',
    paddingHorizontal: 40,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    opacity: 0.3,
  },
  graphPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionCurve: {
    // This would be an SVG in production
    width: '100%',
    height: 200,
    backgroundColor: 'transparent',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'Nimbus Sans',
  },
  legendContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 2,
    borderRadius: 9999,
    backgroundColor: colors.primary,
  },
  legendDotDashed: {
    backgroundColor: colors.outline,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 9,
    color: colors.onSurface,
    fontFamily: 'Nimbus Sans',
  },
  legendTextSecondary: {
    fontSize: 9,
    color: colors.textSecondary,
    fontFamily: 'Nimbus Sans',
  },

  // Benefits Section
  benefitsSection: {
    marginTop: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitContent: {
    flex: 1,
    gap: 4,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
    lineHeight: 24,
  },
  benefitDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.03,
        shadowRadius: 40,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#DF0E84',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  startButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Nimbus Sans',
  },

  // Spacer
  bottomSpacer: {
    height: 100,
  },
});
