/**
 * Tab Navigation Layout — Shell for main app tabs
 * Structure: 3 Piliers (Accueil, Memorize, Stats) + FAB + Menu Plus
 * See Figma: https://www.figma.com/design/BL5Cbn6s2aMXAtNDmAVJ8F/VersyFlow
 */

import { useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const router = useRouter();
  const { colors, sh, sp } = useAppTheme();
  const [showPlusMenu, setShowPlusMenu] = useState(false);

  const handleStartSession = () => {
    router.push('/bible/explorer');
  };

  const plusMenuItems = [
    {
      id: 'calendar',
      title: 'Calendrier de révision',
      subtitle: 'Planification à long terme',
      icon: 'calendar',
      iconColor: colors.primary,
      action: () => router.push('/review/calendar'),
    },
    {
      id: 'profile',
      title: 'Profil & Paramètres',
      subtitle: 'Langue, traduction, compte',
      icon: 'settings',
      iconColor: colors.textSecondary,
      action: () => router.push('/(tabs)/settings'),
    },
    {
      id: 'notifications',
      title: 'Centre de notifications',
      subtitle: 'Historique des alertes',
      icon: 'notifications',
      iconColor: colors.warning,
      action: () => router.push('/notifications'),
    },
    {
      id: 'help',
      title: 'Aide & Support',
      subtitle: 'FAQ, Tutoriels, Diagnostics',
      icon: 'help-circle',
      iconColor: colors.info,
      action: () => router.push('/settings/about'),
    },
    {
      id: 'data',
      title: 'Gestion des données',
      subtitle: 'Exportation & Accessibilité',
      icon: 'download',
      iconColor: colors.success,
      action: () => router.push('/settings/backup'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ],
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarBackground: () => (
            <View style={[styles.tabBarBackground, { backgroundColor: colors.surface }]} />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Memorize',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'book' : 'book-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'analytics' : 'analytics-outline'}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* FAB Button - Start Session */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, ...sh.rose },
        ]}
        onPress={handleStartSession}
        activeOpacity={0.85}
        accessibilityLabel="Commencer une session"
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Menu Plus Button */}
      <TouchableOpacity
        style={[
          styles.plusButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={() => setShowPlusMenu(true)}
        activeOpacity={0.85}
        accessibilityLabel="Plus d'options"
      >
        <Ionicons name="ellipsis-vertical" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Plus Menu Modal */}
      <Modal
        visible={showPlusMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlusMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlusMenu(false)}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.surface, ...sh.modal },
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Plus d'options
              </Text>
              <TouchableOpacity onPress={() => setShowPlusMenu(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {plusMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => {
                    item.action();
                    setShowPlusMenu(false);
                  }}
                >
                  <View
                    style={[
                      styles.menuIcon,
                      { backgroundColor: item.iconColor + '20' },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.iconColor}
                    />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View
              style={[
                styles.modalFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <Text style={[styles.modalFooterText, { color: colors.textMuted }]}>
                VersyFlow v0.1.0
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarBackground: {
    backgroundColor: colors.surface,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },

  // FAB
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

  // Plus Button
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Modal
  modalOverlay: {
    flex: 1,
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
