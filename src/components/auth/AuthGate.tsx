/**
 * AuthGate — Authentication Gate Component
 * Routes user based on authentication state
 *
 * Features:
 * - Skip authentication (guest mode)
 * - Optional cloud sync
 * - Persistent login session
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  isAuthenticated: boolean;
  onLogin: () => void;
  onSignup: () => void;
  onSkip: () => void;
}

export default function AuthGate({ isAuthenticated, onLogin, onSignup, onSkip }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Already authenticated - skip gate
  if (isAuthenticated) {
    onSkip();
    return null;
  }

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
    backgroundColor: '#FFF0F6',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E6E',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  buttonPrimary: {
    backgroundColor: '#E91E8C',
    borderRadius: 26,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E91E8C',
    marginBottom: 12,
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E91E8C',
  },
  buttonGhost: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonTextGhost: {
    fontSize: 14,
    color: '#A0A0A0',
    textDecorationLine: 'underline',
  },
  note: {
    fontSize: 12,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
});
