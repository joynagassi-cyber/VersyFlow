/**
 * Auth Gate Component — Shows login/signup or skip option
 */

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';

interface Props {
  onLogin: () => void;
  onSignup: () => void;
  onSkip: () => void;
}

export default function AuthGate({ onLogin, onSignup, onSkip }: Props) {
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  if (!mounted) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenue sur VersyFlow</Text>
      <Text style={styles.subtitle}>
        Connectez-vous pour synchroniser vos mémorisations sur le cloud, ou continuez en mode local.
      </Text>

      <TouchableOpacity style={styles.buttonPrimary} onPress={onLogin}>
        <Text style={styles.buttonTextPrimary}>Se connecter</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonSecondary} onPress={onSignup}>
        <Text style={styles.buttonTextSecondary}>Créer un compte</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonGhost} onPress={onSkip}>
        <Text style={styles.buttonTextGhost}>Continuer sans compte</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Votre progression sera sauvegardée localement. Connectez-vous plus tard pour synchroniser.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 26,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  buttonGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonTextGhost: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
