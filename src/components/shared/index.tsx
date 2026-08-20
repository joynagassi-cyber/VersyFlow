/**
 * Shared Components — VersyFlow Design System
 * All components use theme tokens — no hardcoded colors
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/theme/useTheme';
import { colors } from '@/tokens';

// ─── Screen Wrapper ──────────────────────────────────────────────────────────

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  showScrollView?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentStyle,
  showScrollView = true,
}) => {
  const { colors, sh, sp } = useAppTheme();
  const content = showScrollView ? (
    <View style={[{ flex: 1 }, style]}>{children}</View>
  ) : (
    children
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {content}
    </View>
  );
};

// ─── Header Bar ──────────────────────────────────────────────────────────────

interface HeaderBarProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  backgroundColor?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onBack,
  rightAction,
}) => {
  const { colors, sp, sh } = useAppTheme();

  return (
    <View
      style={[
        styles.headerBar,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingHorizontal: sp.lg,
          paddingVertical: sp.md,
          ...sh.md,
        },
      ]}
    >
      {onBack && (
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.surfaceTint },
          ]}
          onPress={onBack}
          accessibilityLabel="Retour"
        >
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction || <View style={{ width: 40 }} />}
    </View>
  );
};

// ─── Primary Button ──────────────────────────────────────────────────────────

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled,
  loading,
  fullWidth,
  style,
}) => {
  const { colors, rad, sh, sp } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        {
          backgroundColor: disabled ? colors.textMuted : colors.primary,
          borderRadius: rad.pill,
          paddingHorizontal: sp.lg,
          paddingVertical: sp.md,
          ...sh.rose,
        },
        fullWidth && { width: '100%' },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Secondary Button ────────────────────────────────────────────────────────

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  title,
  onPress,
  disabled,
  style,
}) => {
  const { colors, rad, sp } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        {
          borderColor: disabled ? colors.textMuted : colors.primary,
          borderRadius: rad.pill,
          paddingHorizontal: sp.lg,
          paddingVertical: sp.md,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.secondaryButtonText, { color: disabled ? colors.textMuted : colors.primary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Icon Button ─────────────────────────────────────────────────────────────

interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 24,
  color,
  style,
  accessibilityLabel,
}) => {
  const { colors, sp } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { backgroundColor: colors.surfaceTint, padding: sp.sm },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
    >
      <Ionicons name={icon as any} size={size} color={color || colors.textSecondary} />
    </TouchableOpacity>
  );
};

// ─── Section Title ───────────────────────────────────────────────────────────

interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, action }) => {
  const { colors, sp, typ } = useAppTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: sp.md, paddingHorizontal: sp.lg }}>
      <Text style={[typ.titleLarge, { color: colors.textPrimary }]}>{title}</Text>
      {action}
    </View>
  );
};

// ─── Card Container ──────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const { colors, rad, sh, sp } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: rad.xl,
          padding: sp.lg,
          ...sh.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: string;
  iconColor?: string;
  iconBgColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  iconColor = colors.primary,
  iconBgColor = colors.primaryLight,
}) => {
  const { colors, rad, sp, typ } = useAppTheme();

  return (
    <Card style={{ flex: 1, alignItems: 'center' }}>
      {icon && (
        <View
          style={[
            styles.statIcon,
            {
              backgroundColor: iconBgColor || colors.surfaceTint,
              width: 48,
              height: 48,
              borderRadius: 24,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: sp.sm,
            },
          ]}
        >
          <Ionicons name={icon as any} size={24} color={iconColor} />
        </View>
      )}
      <Text style={[typ.headlineSmall, { color: colors.textPrimary, fontWeight: '800' }]}>
        {value}
      </Text>
      <Text style={[typ.bodySmall, { color: colors.textTertiary, marginTop: sp.xs }]} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  const { colors, rad, sp, typ } = useAppTheme();

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: sp['2xl'], paddingHorizontal: sp.xl }}>
      <Ionicons name={icon as any} size={64} color={colors.textMuted} />
      <Text style={[typ.titleMedium, { color: colors.textPrimary, marginTop: sp.lg, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[typ.bodyMedium, { color: colors.textTertiary, marginTop: sp.sm, textAlign: 'center' }]}>
        {description}
      </Text>
      {action && (
        <TouchableOpacity
          style={[
            styles.emptyAction,
            { backgroundColor: colors.primary, borderRadius: rad.pill, paddingHorizontal: sp.xl, paddingVertical: sp.md },
          ]}
          onPress={action.onPress}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Loading State ───────────────────────────────────────────────────────────

export const LoadingState: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  card: {
    marginBottom: 16,
  },
  statIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAction: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
