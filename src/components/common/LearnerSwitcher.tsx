/**
 * Learner Switcher — Dropdown for switching active learner in Family mode
 * Phase 5: Learner Switcher
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { useContextStore } from '@/store/context-store';
import { useProfileStore } from '@/store/profile-store';
import { useFamilyStore } from '@/store/family-store';

export function LearnerSwitcher() {
  const { colors, sp } = useAppTheme();
  const { activeContext, activeLearnerId, setLearner } = useContextStore();
  const { profiles, selectProfile } = useProfileStore();
  const { activeFamilyId, families } = useFamilyStore();

  const [showPicker, setShowPicker] = useState(false);

  // In family mode, show family members; in personal, show profiles
  const isFamily = activeContext === 'family' && activeFamilyId !== null;

  // Get available learners
  const familyMembers = profiles; // In MVP, all profiles are potential family members
  const personalProfiles = profiles;

  const currentLearner = profiles.find(p => p.id === activeLearnerId) || profiles.find(p => p.id === useProfileStore.getState().activeProfileId) || null;

  const handleSelectLearner = (profileId: string) => {
    setLearner(profileId);
    selectProfile(profileId);
    setShowPicker(false);
  };

  // Personal mode: show profile selector
  if (!isFamily) {
    if (profiles.length <= 1) return null; // No need to switch

    return (
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.surfaceTint }]}
        onPress={() => setShowPicker(true)}
      >
        {currentLearner ? (
          <>
            <Text style={styles.avatar}>{currentLearner.avatar || '👤'}</Text>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{currentLearner.displayName}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
          </>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textMuted }]}>Profil</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Family mode: show family learner selector
  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: colors.primary + '15' }]}
        onPress={() => setShowPicker(true)}
      >
        {currentLearner ? (
          <>
            <Text style={styles.avatar}>{currentLearner.avatar || '👤'}</Text>
            <Text style={[styles.name, { color: colors.primary }]}>{currentLearner.displayName}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </>
        ) : (
          <Text style={[styles.placeholder, { color: colors.primary }]}>Sélectionner</Text>
        )}
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                {isFamily ? 'Membre de la famille' : 'Mon profil'}
              </Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent}>
              {profiles.map((profile) => {
                const isActive = activeLearnerId === profile.id;
                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => handleSelectLearner(profile.id)}
                  >
                    <Text style={styles.optionAvatar}>{profile.avatar || '👤'}</Text>
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionName, { color: colors.textPrimary }]}>{profile.displayName}</Text>
                      <Text style={[styles.optionId, { color: colors.textMuted }]}>
                        {isActive ? (isFamily ? 'Actif dans la famille' : 'Profil actif') : 'Appuyer pour sélectionner'}
                      </Text>
                    </View>
                    {isActive && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
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
  },
  avatar: {
    fontSize: 18,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
  },
  placeholder: {
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
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
  optionAvatar: {
    fontSize: 24,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionId: {
    fontSize: 12,
    marginTop: 2,
  },
});
