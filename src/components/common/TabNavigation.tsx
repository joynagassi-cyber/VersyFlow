/**
 * Tab Navigation — Bottom tabs component
 */

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface TabNavigationProps {
  tabs: Array<{ key: string; label: string; icon?: string }>;
  activeKey: string;
  onChange: (key: string) => void;
}

export function TabNavigation({ tabs, activeKey, onChange }: TabNavigationProps) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.icon} {tab.label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE4EE',
    height: 60,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#A0A0A0',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#E91E8C',
  },
  activeIndicator: {
    position: 'absolute',
    top: -1,
    width: 32,
    height: 2,
    backgroundColor: '#E91E8C',
  },
});
