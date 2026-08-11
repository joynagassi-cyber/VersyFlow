/**
 * Auth Login Screen — Enhanced with skip option
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/theme/useTheme';
import { useRouter } from 'expo-router';
import { InsForgeAuthService } from '@/auth';

interface Props {
  onSkip?: () => void;
}

export default function LoginScreen({ onSkip }: Props) {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = new InsForgeAuthService();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await auth.signIn(email, password);
      // Navigation vers l'accueil après connexion réussie
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err?.message || 'Échec de la connexion. Vérifiez vos identifiants.');
      Alert.alert('Erreur', err?.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Se connecter</Text>
        <Text style={styles.subtitle}>Accédez à votre tableau de bord VersyFlow</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push('/auth/signup')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Pas encore de compte ? S'inscrire
          </Text>
        </TouchableOpacity>

        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={loading}
          >
            <Text style={styles.skipText}>Continuer sans compte</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.note}>
          Votre progression sera sauvegardée localement
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceTint,
    padding: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textTertiary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 24,
    padding: 12,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
