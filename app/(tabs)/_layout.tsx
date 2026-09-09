/**
 * Tab Navigation Layout — Shell for main app tabs
 * Structure: 3 Piliers (Accueil, Memorize, Stats) + FAB + Menu Plus
 */

import { useState } from 'react';
import { useRouter } from '@/hooks/useIonicNavigation';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
} from '@/components/ui/Primitives';
import { IonIcon } from '@ionic/react';
import { home, book, analytics, add, ellipsisVertical, close, calendar, settings, notifications, helpCircle, download, chevronForward } from 'ionicons/icons';
import { useAppTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const router = useRouter();
  const { colors, sh, sp, rad } = useAppTheme();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('/tabs/home');

  const handleStartSession = () => {
    router.push('/bible/explorer');
  };

  const plusMenuItems = [
    { id: 'calendar', title: 'Calendrier de révision', subtitle: 'Planification à long terme', icon: calendar, iconColor: colors.primary, action: () => router.push('/review/calendar') },
    { id: 'profile', title: 'Profil & Paramètres', subtitle: 'Langue, traduction, compte', icon: settings, iconColor: colors.textSecondary, action: () => router.push('/tabs/settings') },
    { id: 'notifications', title: 'Centre de notifications', subtitle: 'Historique des alertes', icon: notifications, iconColor: colors.warning, action: () => router.push('/notifications') },
    { id: 'help', title: 'Aide & Support', subtitle: 'FAQ, Tutoriels, Diagnostics', icon: helpCircle, iconColor: colors.info, action: () => router.push('/settings/about') },
    { id: 'data', title: 'Gestion des données', subtitle: 'Exportation & Accessibilité', icon: download, iconColor: colors.success, action: () => router.push('/settings/backup') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Content Area */}
      <View style={styles.content}>
        {/* The actual page content is rendered by the router */}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: sp.sm,
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8 },
          android: { elevation: 8 },
        }),
      }]}>
        {[
          { path: '/tabs/home', icon: home, label: 'Accueil' },
          { path: '/tabs/explore', icon: book, label: 'Memorize' },
          { path: '/tabs/progress', icon: analytics, label: 'Stats' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.path}
            style={styles.tabItem}
            onPress={() => { router.push(tab.path); setActiveTab(tab.path); }}
          >
            <IonIcon icon={tab.icon} size="large" color={activeTab === tab.path ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.path ? colors.primary : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, ...sh.rose }]}
        onPress={handleStartSession}
        accessibilityLabel="Commencer une session"
      >
        <IonIcon icon={add} size="large" color="light" />
      </TouchableOpacity>

      {/* Plus Button */}
      <TouchableOpacity
        style={[styles.plusButton, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 4 },
          }),
        }]}
        onPress={() => setShowPlusMenu(true)}
        accessibilityLabel="Plus d'options"
      >
        <IonIcon icon={ellipsisVertical} size="large" color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Plus Menu Modal */}
      {showPlusMenu && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlusMenu(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, ...sh.modal }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Plus d'options</Text>
              <TouchableOpacity onPress={() => setShowPlusMenu(false)}>
                <IonIcon icon={close} size="large" color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {plusMenuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => { item.action(); setShowPlusMenu(false); }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.iconColor + '20' }]}>
                    <IonIcon icon={item.icon} size="small" color={item.iconColor} />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text>
                  </View>
                  <IonIcon icon={chevronForward} size="small" color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.modalFooterText, { color: colors.textMuted }]}>VersyFlow v0.1.0</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    paddingHorizontal: sp.md,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalScroll: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  modalFooterText: {
    fontSize: 12,
  },
});
