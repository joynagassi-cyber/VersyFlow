/**
 * Root Layout — VersyFlow App Entry Point
 * Sets up: Theme Provider, I18n, Safe Area, RTL direction
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Platform, Image, Pressable, TextInput, Modal, StatusBar } from '@/components/ui/Primitives';
import { useAppTheme } from '@/theme/useTheme';

export default function RootLayout() {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>VersyFlow</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
