/**
 * Review Summary Screen — Shows review statistics and progress
 * See docs/08-ui-screens.md §14
 */

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '@/hooks/useI18n';

export default function ReviewSummaryScreen() {
  const router = useRouter();
  const { t } = useI18n();

  // Données de mock pour le résumé
  const stats = {
    totalReviews: 47,
    todayReviews: 5,
    mastered: 23,
    inProgress: 12,
    dueToday: 5,
    streak: 3,
    retentionRate: 85,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header avec la streak */}
        <View style={styles.streakCard}>
          <Text style={styles.streakTitle}>Série quotidienne 🔥</Text>
          <Text style={styles.streakNumber}>{stats.streak}</Text>
          <Text style={styles.streakLabel}>jour{stats.streak > 1 ? 's' : ''} de suite</Text>
        </View>

        {/* Statistiques principales */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>{t('review.totalReviews')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.dueToday}</Text>
            <Text style={styles.statLabel}>{t('review.dueToday')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.mastered}</Text>
            <Text style={styles.statLabel}>{t('review.mastered')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>{t('review.inProgress')}</Text>
          </View>
        </View>

        {/* Graphique de rétention */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Taux de rétention</Text>
          <View style={styles.chart}>
            <View style={styles.chartBar}>
              <View style={[styles.chartFill, { width: `${stats.retentionRate}%` }]}/>
            </View>
            <Text style={styles.chartPercent}>{stats.retentionRate}%</Text>
          </View>
          <Text style={styles.chartSubtitle}>{t('review.retentionDescription')}</Text>
        </View>

        {/* Statistiques détaillées */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Révisions aujourd'hui</Text>
            <Text style={styles.detailValue}>{stats.todayReviews}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Verses memorisés</Text>
            <Text style={styles.detailValue}>{stats.mastered}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>En cours</Text>
            <Text style={styles.detailValue}>{stats.inProgress}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => router.replace('/review/queue')}>
            <Text style={styles.buttonText}>{t('review.startReviewNow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => router.back()}>
            <Text style={styles.buttonTextBack}>{t('review.backToQueue')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF0F6',
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  streakCard: {
    backgroundColor: '#E91E8C',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    ...shadow.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E91E8C',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...shadow.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartBar: {
    flex: 1,
    height: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartFill: {
    height: '100%',
    backgroundColor: '#E91E8C',
    borderRadius: 12,
  },
  chartPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E91E8C',
    marginLeft: 12,
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  detailItemLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  actions: {
    marginTop: 24,
  },
  buttonPrimary: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E91E8C',
    borderWidth: 2,
    borderRadius: 26,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextBack: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E8C',
  },
});

const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
};
