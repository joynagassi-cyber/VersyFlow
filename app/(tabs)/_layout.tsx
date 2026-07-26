/**
 * Tab Navigation Layout — Shell for main app tabs
 * See docs/08-ui-screens.md (HomeScreen, Explore, Progress, Settings)
 */

import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E91E8C',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => (
            <View style={[styles.icon, { backgroundColor: color, borderRadius: size / 2 }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorer',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progression',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE4EE',
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  icon: {
    width: 20,
    height: 20,
  },
});
