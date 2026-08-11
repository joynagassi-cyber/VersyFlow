/**
 * Auth Signup Screen — Enhanced with skip option
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

export default function SignupScreen({ onSkip }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const auth = new InsForgeAuthService();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await auth.signUp(email, password);
      setSuccess(true);
      // Rediriger vers la page de vérification ou login après un bref délai
      setTimeout(() => {
        router.push('/auth/verify');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Échec de l\'inscription. Veuillez réessayer.');
      Alert.alert('Erreur', err?.message || 'Échec de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Inscription réussie !</Text>
          <Text style={styles.successMessage}>
            Un e-mail de vérification a été envoyé à votre adresse.
          </Text>
          <ActivityIndicator color={colors.primary} size="large" style={styles.spinner} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez-nous pour commencer votre parcours biblique</Text>

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
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => router.push('/auth/login')}
          disabled={loading}
        >
          <Text style={styles.linkText}>
            Déjà un compte ? Connectez-vous
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
          L'inscription est facultative. Votre progression sera sauvegardée localement.
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
    backgroundColor: '#FFE4E4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFAAAA',
  },
  errorText: {
    color: '#CC0000',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  spinner: {
    marginBottom: 24,
  },
});
