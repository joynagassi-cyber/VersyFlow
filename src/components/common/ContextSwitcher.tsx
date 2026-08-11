/**
 * Context Switcher — Header component for switching Personal/Family context
 * Phase 3: Context Switcher UI
 */

import { useState } from 'react';
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
import { useContextStore } from '@/store/context-store';
import { useFamilyStore } from '@/store/family-store';
import { useRouter } from 'expo-router';

export function ContextSwitcher() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const { activeContext, activeFamilyId, switchToFamily, switchToPersonal } = useContextStore();
  const { families } = useFamilyStore();

  const [showPicker, setShowPicker] = useState(false);

  const activeFamily = families.find(f => f.id === activeFamilyId) || null;

  const handleSwitch = (context: 'personal' | 'family', familyId?: string) => {
    setShowPicker(false);
    if (context === 'personal') {
      switchToPersonal();
    } else if (familyId) {
      switchToFamily(familyId);
      router.push('/family/home');
    }
  };

  return (
    <>
      {/* Context Badge in Header */}
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: activeContext === 'family' ? colors.primary + '20' : colors.surfaceTint }]}
        onPress={() => setShowPicker(true)}
      >
        {activeContext === 'family' && activeFamily ? (
          <>
            <Text style={styles.contextIcon}>{activeFamily.icon}</Text>
            <View style={styles.contextInfo}>
              <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Famille</Text>
              <Text style={[styles.contextName, { color: colors.textPrimary }]}>{activeFamily.name}</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </>
        ) : (
          <>
            <Ionicons name="person" size={16} color={colors.primary} />
            <View style={styles.contextInfo}>
              <Text style={[styles.contextLabel, { color: colors.textMuted }]}>Personnel</Text>
              <Text style={[styles.contextName, { color: colors.textPrimary }]}>Mon profil</Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
          </>
        )}
      </TouchableOpacity>

      {/* Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, ...sh.modal },
            ]}
          >
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Changer de contexte</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent}>
              {/* Personal Context */}
              <TouchableOpacity
                style={[
                  styles.option,
                  activeContext === 'personal' && styles.optionActive,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => handleSwitch('personal')}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.iconBgRose }]}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Personnel</Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Mon espace privé</Text>
                </View>
                {activeContext === 'personal' && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Family Contexts */}
              {families.map((family) => {
                const isActive = activeContext === 'family' && activeFamilyId === family.id;
                return (
                  <TouchableOpacity
                    key={family.id}
                    style={[
                      styles.option,
                      isActive && styles.optionActive,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => handleSwitch('family', family.id)}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: family.color + '20' }]}>
                      <Text style={styles.optionEmoji}>{family.icon}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>{family.name}</Text>
                      <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Contexte familial</Text>
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={20} color={family.color} />
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Create Family */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => {
                  setShowPicker(false);
                  router.push('/family/create');
                }}
              >
                <Ionicons name="add-circle" size={18} color="#fff" />
                <Text style={styles.createButtonText}>Créer une famille</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  contextIcon: {
    fontSize: 18,
  },
  contextInfo: {
    flex: 1,
  },
  contextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contextName: {
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetContent: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  optionActive: {
    backgroundColor: '#fafafa',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmoji: {
    fontSize: 22,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 14,
    borderRadius: 26,
    backgroundColor: '#E91E8C',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
