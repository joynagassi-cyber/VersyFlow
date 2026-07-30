import { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { InsForgeAuthService } from '@/auth';

export default function VerifyScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sent, setSent] = useState(false);

  const auth = new InsForgeAuthService();

  // Simuler l'envoi d'un code de vérification - dans une application réelle,
  // cela appellerait l'API pour renvoyer un code par e-mail
  const handleSendCode = async () => {
    // Sur les plateformes réelles, on vérifie d'abord l'e-mail
    // Ici, on simule l'envoi du code
    if (!code) {
      Alert.alert('Erreur', 'Entrez votre adresse e-mail');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulation d'appel API - dans la vraie application, on appellera
      // auth.sendVerificationCode(email)
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
      // Simulation de vérification du code - dans la vraie application,
      // on appellera auth.verifyVerificationCode(email, code)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Le code test "123456" fonctionne
      if (code !== '123456') {
        throw new Error('Code de vérification invalide');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/(tabs)');
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
            <ActivityIndicator color="#E91E8C" size="large" />
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
                    <ActivityIndicator color="#FFFFFF" size="small" />
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
                    <ActivityIndicator color="#FFFFFF" size="small" />
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
    backgroundColor: '#FFF0F6',
    padding: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6E6E6E',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFE4EE',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E91E8C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    alignItems: 'center',
  },
  linkText: {
    color: '#E91E8C',
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
    color: '#2D2D2D',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    color: '#6E6E6E',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
  },
});