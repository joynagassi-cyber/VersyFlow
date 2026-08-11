/**
 * Verify Screen — Email verification
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

export default function VerifyScreen() {
  const { colors, sp, sh, rad } = useAppTheme();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendCode = async () => {
    if (!code) {
      Alert.alert('Erreur', 'Entrez votre adresse e-mail');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulation d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSent(true);
      Alert.alert('Code envoyé', `Un code de vérification a été envoyé à ${code}\n(code test: 123456)`);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Échec de l\'envoi du code');
      Alert.alert('Erreur', err?.message || 'Échec de l\'envoi du code');
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) {
      Alert.alert('Erreur', 'Entrez le code de vérification');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (code !== '123456') {
        throw new Error('Code de vérification invalide');
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Code de vérification invalide');
      Alert.alert('Erreur', err?.message || 'Code de vérification invalide');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successTitle}>Vérification réussie !</Text>
            <Text style={styles.successMessage}>
              Vous êtes maintenant connecté à votre compte.
            </Text>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <>
            <Text style={styles.title}>Vérifier votre e-mail</Text>
            <Text style={styles.subtitle}>
              {sent ? 'Entrez le code de vérification' : 'Entrez votre e-mail pour recevoir un code'}
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!sent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Adresse e-mail"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Envoyer le code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Code de vérification (6 chiffres)"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="numeric"
                  maxLength={6}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={verifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.surface} size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Vérifier</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.link}
                  onPress={() => setSent(false)}
                  disabled={loading}
                >
                  <Text style={styles.linkText}>
                    Pas reçu le code ? Réenvoyer
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
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
});
