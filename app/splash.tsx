/**
 * SplashScreen — App Entry Point
 * Displays the VersyFlow logo (image asset) + tagline while the app
 * initializes. Uses the same logo as the app icon (assets/icons/versyflow_logo_app.png).
 */

import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';
import logoUrl from '@/assets/icons/versyflow_logo_app.png?url';

interface Props {
  onFinish: () => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default function SplashScreen({ onFinish }: Props) {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.logoContainer,
          {
            opacity: visible ? 1 : 0,
            transform: `scale(${visible ? 1 : 0.8})`,
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          },
        ]}
      >
        <Image
          source={logoUrl}
          style={[styles.logoImage, { opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease' }]}
          alt="VersyFlow"
        />
        <Text style={[styles.logo, { color: colors.primary }]}>VersyFlow</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Mémorisation biblique intuitive
        </Text>
      </View>
    </View>
  );
}
