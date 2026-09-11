/**
 * Ionic-Compatible Primitive Wrappers
 *
 * Provides React Native-compatible APIs that render Ionic elements underneath,
 * enabling a drop-in migration path from React Native to Ionic.
 *
 * Usage:
 *   import {
 *     View, Text, TouchableOpacity, StyleSheet, ActivityIndicator
 *   } from '@/components/ui/Primitives';
 *
 *   // Existing RN code works unchanged:
 *   <View style={styles.container}>
 *     <Text style={styles.title}>Hello</Text>
 *     <TouchableOpacity onPress={handlePress} style={styles.button}>
 *       <Text>Tap me</Text>
 *     </TouchableOpacity>
 *   </View>
 */

import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonChip,
  IonFab,
  IonFabButton,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonModal,
  IonPopover,
  IonBackButton,
  IonNav,
  IonRouterLink,
  IonPage,
  IonFooter,
  type IonContentProps,
  type IonHeaderProps,
  type IonToolbarProps,
  type IonButtonsProps,
  type IonButtonProps,
  type IonSpinnerProps,
  type IonChipProps,
  type IonFabProps,
  type IonFabButtonProps,
  type IonListProps,
  type IonItemProps,
  type IonLabelProps,
  type IonToggleProps,
  type IonInputProps,
  type IonTextareaProps,
  type IonSelectProps,
  type IonSegmentProps,
  type IonSegmentButtonProps,
  type IonRefresherProps,
  type IonInfiniteScrollProps,
  type IonModalProps,
  type IonPopoverProps,
  type IonPageProps,
  type IonFooterProps,
  type IonNavProps,
  type IonRouterLinkProps,
} from '@ionic/react';
// useTheme imported by components that need it
import type { CSSProperties } from 'react';
import { useTheme, useAppTheme } from '@/theme/useTheme';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RNStyle {
  flex?: number | string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch';
  overflow?: 'visible' | 'hidden' | 'scroll';
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;
  maxWidth?: number | string;
  maxHeight?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginRight?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  padding?: number | string;
  paddingTop?: number | string;
  paddingRight?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number | string;
  backgroundColor?: string;
  opacity?: number;
  zIndex?: number;
  gap?: number | string;
}

export interface RNTextStyle extends RNStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  color?: string;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
  textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
  textDecorationColor?: string;
  writingDirection?: 'auto' | 'ltr' | 'rtl';
  numberOfLines?: number;
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────

export type StyleSheetType = {
  create<T extends Record<string, RNStyle | RNTextStyle>>(styles: T): T;
};

/**
 * Lightweight StyleSheet that translates RN style objects to CSS-in-JS objects.
 * Supports the same API as React Native's StyleSheet.create() but outputs CSS objects.
 */
export const StyleSheet: StyleSheetType = {
  create<T extends Record<string, RNStyle | RNTextStyle>>(styles: T): T {
    const cssStyles: Record<string, React.CSSProperties> = {};
    for (const [key, style] of Object.entries(styles)) {
      cssStyles[key] = convertStyle(style);
    }
    return cssStyles as unknown as T;
  },
};

/**
 * Convert a React Native style object to a CSS-in-JS object compatible with Ionic/React.
 */
function convertStyle(style: RNStyle | RNTextStyle): React.CSSProperties {
  const result: React.CSSProperties = {};

  const numberToPx = (value: number | string | undefined): string | undefined => {
    if (value === undefined) return undefined;
    if (typeof value === 'number') return `${value}px`;
    return value;
  };

  const setProp = (
    key: keyof RNStyle | keyof RNTextStyle,
    rnKey: string,
    cssKey: string,
    isNumber = false,
  ) => {
    const val = (style as Record<string, unknown>)[key];
    if (val !== undefined) {
      (result as Record<string, unknown>)[cssKey] = isNumber ? numberToPx(val as number) : val;
    }
  };

  // Flex layout
  setProp('flex', 'flex', 'flex');
  setProp('flexDirection', 'flexDirection', 'flexDirection');
  setProp('justifyContent', 'justifyContent', 'justifyContent');
  setProp('alignItems', 'alignItems', 'alignItems');
  setProp('alignSelf', 'alignSelf', 'alignSelf');
  setProp('alignContent', 'alignContent', 'alignContent');
  setProp('gap', 'gap', 'gap', true);

  // Positioning
  setProp('position', 'position', 'position');
  setProp('top', 'top', 'top', true);
  setProp('right', 'right', 'right', true);
  setProp('bottom', 'bottom', 'bottom', true);
  setProp('left', 'left', 'left', true);
  setProp('overflow', 'overflow', 'overflow');
  setProp('zIndex', 'zIndex', 'zIndex', true);

  // Sizing
  setProp('width', 'width', 'width', true);
  setProp('height', 'height', 'height', true);
  setProp('minWidth', 'minWidth', 'minWidth', true);
  setProp('minHeight', 'minHeight', 'minHeight', true);
  setProp('maxWidth', 'maxWidth', 'maxWidth', true);
  setProp('maxHeight', 'maxHeight', 'maxHeight', true);

  // Spacing
  setProp('margin', 'margin', 'margin', true);
  setProp('marginTop', 'marginTop', 'marginTop', true);
  setProp('marginRight', 'marginRight', 'marginRight', true);
  setProp('marginBottom', 'marginBottom', 'marginBottom', true);
  setProp('marginLeft', 'marginLeft', 'marginLeft', true);
  setProp('padding', 'padding', 'padding', true);
  setProp('paddingTop', 'paddingTop', 'paddingTop', true);
  setProp('paddingRight', 'paddingRight', 'paddingRight', true);
  setProp('paddingBottom', 'paddingBottom', 'paddingBottom', true);
  setProp('paddingLeft', 'paddingLeft', 'paddingLeft', true);

  // Border
  setProp('borderWidth', 'borderWidth', 'borderWidth', true);
  setProp('borderTopWidth', 'borderTopWidth', 'borderTopWidth', true);
  setProp('borderRightWidth', 'borderRightWidth', 'borderRightWidth', true);
  setProp('borderBottomWidth', 'borderBottomWidth', 'borderBottomWidth', true);
  setProp('borderLeftWidth', 'borderLeftWidth', 'borderLeftWidth', true);
  setProp('borderColor', 'borderColor', 'borderColor');
  setProp('borderTopColor', 'borderTopColor', 'borderTopColor');
  setProp('borderRightColor', 'borderRightColor', 'borderRightColor');
  setProp('borderBottomColor', 'borderBottomColor', 'borderBottomColor');
  setProp('borderLeftColor', 'borderLeftColor', 'borderLeftColor');
  setProp('borderStyle', 'borderStyle', 'borderStyle');
  setProp('borderRadius', 'borderRadius', 'borderRadius', true);

  // Background
  setProp('backgroundColor', 'backgroundColor', 'backgroundColor');

  // Opacity
  setProp('opacity', 'opacity', 'opacity', true);

  // Text-specific
  const textStyle = style as RNTextStyle;
  if ('fontSize' in textStyle && textStyle.fontSize !== undefined) {
    result.fontSize = `${textStyle.fontSize}px`;
  }
  if ('fontWeight' in textStyle && textStyle.fontWeight !== undefined) {
    result.fontWeight = textStyle.fontWeight;
  }
  if ('fontStyle' in textStyle && textStyle.fontStyle !== undefined) {
    result.fontStyle = textStyle.fontStyle;
  }
  if ('fontFamily' in textStyle && textStyle.fontFamily !== undefined) {
    result.fontFamily = textStyle.fontFamily;
  }
  if ('lineHeight' in textStyle && textStyle.lineHeight !== undefined) {
    result.lineHeight = `${textStyle.lineHeight}px`;
  }
  if ('letterSpacing' in textStyle && textStyle.letterSpacing !== undefined) {
    result.letterSpacing = `${textStyle.letterSpacing}px`;
  }
  if ('color' in textStyle && textStyle.color !== undefined) {
    result.color = textStyle.color;
  }
  if ('textAlign' in textStyle && textStyle.textAlign !== undefined) {
    result.textAlign = textStyle.textAlign;
  }
  if ('textTransform' in textStyle && textStyle.textTransform !== undefined) {
    result.textTransform = textStyle.textTransform;
  }
  if ('textDecorationLine' in textStyle && textStyle.textDecorationLine !== undefined) {
    result.textDecorationLine = textStyle.textDecorationLine;
  }
  if ('textDecorationColor' in textStyle && textStyle.textDecorationColor !== undefined) {
    result.textDecorationColor = textStyle.textDecorationColor;
  }
  if ('numberOfLines' in textStyle && textStyle.numberOfLines !== undefined) {
    result.webkitLineClamp = textStyle.numberOfLines;
    result.webkitBoxOrient = 'vertical';
    result.overflow = 'hidden';
  }

  // Platform-specific: react-native shadows
  const styleRecord = style as Record<string, unknown>;
  if (styleRecord.shadowColor || styleRecord.shadowOffset || styleRecord.shadowOpacity !== undefined || styleRecord.elevation !== undefined) {
    const shadowColor = (styleRecord.shadowColor as string) || '#000000';
    const shadowOffset = (styleRecord.shadowOffset as { width: number; height: number }) || { width: 0, height: 1 };
    const shadowOpacity = (styleRecord.shadowOpacity as number) ?? 0.05;
    const shadowRadius = (styleRecord.shadowRadius as number) ?? 2;
    const elevation = (styleRecord.elevation as number) ?? 0;
    result.boxShadow = `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0,0,0,${shadowOpacity})`;
    // Map elevation to box-shadow as a fallback
    if (elevation > 0) {
      result.boxShadow = `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)`;
    }
  }

  return result;
}

// ─── View (IonicView) ─────────────────────────────────────────────────────────

interface IonicViewProps {
  style?: StyleProp<RNStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: string;
  onPress?: () => void;
  onLayout?: (e: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => void;
  onContentSizeChange?: (w: number, h: number) => void;
  collapsable?: boolean;
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
  removeClippedSubviews?: boolean;
  holdsIntervalWhenDragged?: boolean;
  onStartShouldSetResponder?: (e: any) => boolean;
  onResponderTerminate?: (e: any) => void;
  onResponderGrant?: (e: any) => void;
  onResponderMove?: (e: any) => void;
  onResponderRelease?: (e: any) => void;
  onResponderStart?: (e: any) => void;
  onResponderEnd?: (e: any) => void;
  // Extra props for advanced use
  role?: string;
  [key: string]: any;
}

/**
 * IonicView — wraps an Ionic content area or plain div.
 * Maintains View's flex-based layout styling.
 */
export const View = forwardRef<HTMLDivElement, IonicViewProps>(
  ({ style, className, children, testID, accessible, accessibilityLabel, role, ...rest }, ref) => {
    const { colors } = useTheme();
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    return (
      <div
        ref={ref}
        className={className}
        data-testid={testID}
        style={[resolvedStyle, { color: colors.textPrimary }]}
        role={role || 'presentation'}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

View.displayName = 'View';

// ─── Text (IonicText) ─────────────────────────────────────────────────────────

interface IonicTextProps {
  style?: StyleProp<RNTextStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  numberOfInlineLines?: number;
  selectable?: boolean;
  allowFontScaling?: boolean;
  onLayout?: (e: any) => void;
  onPress?: () => void;
  accessibleElementsHidden?: boolean;
  importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  renderToHardwareTextureAndroid?: boolean;
  testIDAccessibility?: string;
  // IonText props
  color?: string;
  expandable?: boolean;
  slots?: Record<string, React.ReactNode>;
  slotProps?: Record<string, object>;
  [key: string]: any;
}

/**
 * IonicText — wraps a <span> or <IonText>.
 * Maintains Text's token-based typography styling.
 */
export const Text = forwardRef<HTMLSpanElement, IonicTextProps>(
  ({ style, className, children, testID, numberOfLines, ellipsizeMode, color, ...rest }, ref) => {
    const { colors, typ } = useTheme();
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNTextStyle))
      : convertStyle(style as RNTextStyle);

    // Apply default text color if not overridden
    const finalStyle = {
      ...resolvedStyle,
      color: (resolvedStyle as any).color || color || colors.textPrimary,
    };

    return (
      <span
        ref={ref}
        className={className}
        data-testid={testID}
        style={finalStyle}
        {...rest}
      >
        {children}
      </span>
    );
  },
);

Text.displayName = 'Text';

// ─── TouchableOpacity (IonicTouchableOpacity) ─────────────────────────────────

interface IonicTouchableOpacityProps {
  style?: StyleProp<RNStyle>;
  className?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  testID?: string;
  accessible?: boolean;
  accessibilityRole?: string;
  accessibilityState?: { disabled?: boolean; selected?: boolean };
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  delayPressIn?: number;
  delayPressOut?: number;
  suppressHighlighting?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * IonicTouchableOpacity — wraps an Ionic button or native button.
 * Maintains TouchableOpacity's onPress behavior.
 */
export const TouchableOpacity = forwardRef<HTMLButtonElement, IonicTouchableOpacityProps>(
  ({
    style,
    className,
    onPress,
    onPressIn,
    onPressOut,
    onLongPress,
    disabled = false,
    activeOpacity = 0.7,
    testID,
    accessible,
    accessibilityRole,
    accessibilityState,
    children,
    ...rest
  }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    const handleClick = useCallback(() => {
      if (!disabled) onPress?.();
    }, [disabled, onPress]);

    const handleMouseDown = useCallback(() => {
      onPressIn?.();
    }, [onPressIn]);

    const handleMouseUp = useCallback(() => {
      onPressOut?.();
    }, [onPressOut]);

    return (
      <button
        ref={ref}
        className={className}
        data-testid={testID}
        disabled={disabled}
        style={[
          resolvedStyle,
          {
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : activeOpacity === 1 ? 1 : undefined,
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            ...(!disabled ? { transition: 'opacity 0.15s ease' } : {}),
          },
        ]}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        aria-disabled={disabled}
        aria-pressed={accessibilityState?.selected}
        role={accessibilityRole || 'button'}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

TouchableOpacity.displayName = 'TouchableOpacity';

// ─── ActivityIndicator (IonicActivityIndicator) ───────────────────────────────

interface IonicActivityIndicatorProps {
  size?: 'small' | 'large' | number;
  color?: string;
  animating?: boolean;
  testID?: string;
  [key: string]: any;
}

/**
 * IonicActivityIndicator — a loading spinner component.
 * Wraps IonSpinner for consistent loading states across platforms.
 */
export const ActivityIndicator = ({
  size = 'small',
  color,
  animating = true,
  testID,
  ...rest
}: IonicActivityIndicatorProps) => {
  const { colors } = useTheme();
  const resolvedColor = color || colors.primary;
  const sizeMap: Record<string, number> = { small: 28, large: 48 };
  const spinSize = typeof size === 'number' ? size : (sizeMap[size] ?? 28);

  if (!animating) return null;

  return (
    <div
      data-testid={testID}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: spinSize,
        height: spinSize,
        ...rest,
      }}
    >
      <IonSpinner
        name="circles"
        color={resolvedColor as any}
        style={{ width: spinSize, height: spinSize } as React.CSSProperties}
        aria-label="Loading"
      />
    </div>
  );
};

// ─── ScrollView ───────────────────────────────────────────────────────────────

interface IonicScrollViewProps {
  style?: StyleProp<RNStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  scrollEventThrottle?: number;
  onScroll?: (e: any) => void;
  contentContainerStyle?: StyleProp<RNStyle>;
  bounces?: boolean;
  directionalLockEnabled?: boolean;
  horizontal?: boolean;
  pagingEnabled?: boolean;
  refreshControl?: React.ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  nestedScrollEnabled?: boolean;
  keyboardShouldPersistTaps?: 'never' | 'always' | 'handled';
  [key: string]: any;
}

/**
 * IonicScrollView — wraps IonContent for scrollable content.
 * Maintains ScrollView's scroll behavior.
 */
export const ScrollView = forwardRef<HTMLIonContentElement, IonicScrollViewProps>(
  ({
    style,
    className,
    children,
    testID,
    showsHorizontalScrollIndicator,
    showsVerticalScrollIndicator,
    scrollEventThrottle,
    onScroll,
    contentContainerStyle,
    bounces,
    directionalLockEnabled,
    horizontal,
    pagingEnabled,
    refreshControl,
    onRefresh,
    refreshing,
    nestedScrollEnabled,
    keyboardShouldPersistTaps,
    ...rest
  }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);
    const resolvedContentStyle = contentContainerStyle
      ? Array.isArray(contentContainerStyle)
        ? contentContainerStyle.map(s => convertStyle(s as RNStyle))
        : convertStyle(contentContainerStyle as RNStyle)
      : undefined;

    return (
      <IonContent
        ref={ref}
        className={className}
        data-testid={testID}
        style={resolvedStyle}
        contentClassName={resolvedContentStyle as any}
        scrollEvents={!!onScroll}
        onIonScroll={onScroll}
        overflowHidden={!showsVerticalScrollIndicator}
        {...rest}
      >
        {refreshControl}
        {children}
      </IonContent>
    );
  },
);

ScrollView.displayName = 'ScrollView';

// ─── Image ────────────────────────────────────────────────────────────────────

interface IonicImageProps {
  source?: { uri?: string; require?: number };
  src?: string;
  alt?: string;
  style?: StyleProp<RNStyle>;
  className?: string;
  testID?: string;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat';
  onLoad?: () => void;
  onError?: () => void;
  [key: string]: any;
}

/**
 * IonicImage — wraps an <img> or <IonImg>.
 * Maintains Image's source and style APIs.
 */
export const Image = React.forwardRef<HTMLImageElement, IonicImageProps>(
  ({ source, src, alt, style, className, testID, resizeMode, onLoad, onError, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    const imageSrc = source?.uri || src;

    const imgStyle: React.CSSProperties = {
      ...resolvedStyle,
      objectFit: resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : 'stretch',
    };

    return (
      <img
        ref={ref}
        src={imageSrc}
        alt={alt || ''}
        className={className}
        data-testid={testID}
        style={imgStyle}
        onLoad={onLoad}
        onError={onError}
        {...rest}
      />
    );
  },
);

Image.displayName = 'Image';

// ─── SafeAreaView ─────────────────────────────────────────────────────────────

interface IonicSafeAreaViewProps {
  style?: StyleProp<RNStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  edges?: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
  [key: string]: any;
}

/**
 * IonicSafeAreaView — wraps content with safe area insets.
 * Mirrors SafeAreaView's edge-based padding behavior.
 */
export const SafeAreaView = forwardRef<HTMLDivElement, IonicSafeAreaViewProps>(
  ({ style, className, children, testID, edges = { top: true, bottom: true }, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    const edgePadding: React.CSSProperties = {
      ...(edges.top ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : {}),
      ...(edges.bottom ? { paddingBottom: 'env(safe-area-inset-bottom, 0px)' } : {}),
      ...(edges.left ? { paddingLeft: 'env(safe-area-inset-left, 0px)' } : {}),
      ...(edges.right ? { paddingRight: 'env(safe-area-inset-right, 0px)' } : {}),
    };

    return (
      <div
        ref={ref}
        className={className}
        data-testid={testID}
        style={{ ...resolvedStyle, ...edgePadding }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

SafeAreaView.displayName = 'SafeAreaView';

// ─── Section ──────────────────────────────────────────────────────────────────

interface IonicSectionProps {
  title?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<RNStyle>;
  className?: string;
  testID?: string;
  [key: string]: any;
}

/**
 * IonicSection — wraps an IonList with optional header.
 * Maintains Section's grouped list behavior.
 */
export const Section = ({ title, header, children, style, className, testID, ...rest }: IonicSectionProps) => {
  const resolvedStyle = Array.isArray(style)
    ? style.map(s => convertStyle(s as RNStyle))
    : convertStyle(style as RNStyle);

  return (
    <IonList className={className} data-testid={testID} style={resolvedStyle} {...rest}>
      {title && <IonItem><IonLabel header>{title}</IonLabel></IonItem>}
      {header}
      {children}
    </IonList>
  );
};

// ─── StatusBar (no-op for web, can be extended) ───────────────────────────────

interface IonicStatusBarProps {
  backgroundColor?: string;
  barStyle?: 'default' | 'light-content' | 'dark-content';
  hidden?: boolean;
  networkActivityIndicatorVisible?: boolean;
  translucent?: boolean;
  [key: string]: any;
}

/**
 * IonicStatusBar — placeholder for web. No-op in browser context.
 * Can be connected to a real status bar plugin on native.
 */
export const StatusBar = ({ backgroundColor, barStyle, hidden, ...rest }: IonicStatusBarProps) => {
  // No-op on web — returns null. Extend with a plugin on native builds.
  return null;
};

// ─── Modal (RN modal -> Ionic modal) ─────────────────────────────────────────

interface IonicModalProps {
  visible?: boolean;
  animationType?: 'slide' | 'fade' | 'none';
  onRequestClose?: () => void;
  onShow?: () => void;
  transparent?: boolean;
  style?: StyleProp<RNStyle>;
  children?: React.ReactNode;
  testID?: string;
  [key: string]: any;
}

/**
 * IonicModal — wraps IonModal for RN-style modal behavior.
 */
export const Modal = ({
  visible = false,
  animationType = 'fade',
  onRequestClose,
  onShow,
  transparent,
  style,
  children,
  testID,
  ...rest
}: IonicModalProps) => {
  const resolvedStyle = Array.isArray(style)
    ? style.map(s => convertStyle(s as RNStyle))
    : convertStyle(style as RNStyle);

  return (
    <IonModal
      isOpen={visible}
      animation={animationType === 'slide' ? 'ion-slide' : animationType === 'fade' ? 'ion-fade' : undefined}
      onDidDismiss={onRequestClose}
      onDidPresent={onShow}
      style={resolvedStyle}
      data-testid={testID}
      {...rest}
    >
      {children}
    </IonModal>
  );
};

// ─── KeyboardAvoidingView (placeholder) ───────────────────────────────────────

interface IonicKeyboardAvoidingViewProps {
  style?: StyleProp<RNStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  behavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
  [key: string]: any;
}

/**
 * IonicKeyboardAvoidingView — wraps content with keyboard-aware padding.
 * Placeholder: can be enhanced with @ionic/react keyboard plugin.
 */
export const KeyboardAvoidingView = forwardRef<HTMLDivElement, IonicKeyboardAvoidingViewProps>(
  ({ style, className, children, testID, behavior = 'padding', keyboardVerticalOffset = 0, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    // Simple padding-based approach; full implementation requires keyboard events
    const paddingBottom = behavior === 'padding' ? keyboardVerticalOffset : 0;

    return (
      <div
        ref={ref}
        className={className}
        data-testid={testID}
        style={{ ...resolvedStyle, paddingBottom }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

KeyboardAvoidingView.displayName = 'KeyboardAvoidingView';

// ─── Alert (RN alert -> Ionic alert) ──────────────────────────────────────────

interface IonicAlertProps {
  title?: string;
  message?: string;
  buttons?: Array<{ text: string; handler?: () => void; cssClass?: string }>;
  onDidDismiss?: () => void;
  [key: string]: any;
}

/**
 * IonicAlert — wraps IonAlert for RN alert functionality.
 */
export const Alert = ({ title, message, buttons, onDidDismiss, ...rest }: IonicAlertProps) => {
  const ionButtons = (buttons || []).map(b => ({
    text: b.text,
    role: b.cssClass?.includes('destructive') ? 'destructive' : 'cancel',
    handler: b.handler,
  }));

  return (
    <IonModal isOpen={false} initialBreakpoint={0} breakpoints={[0]}>
      {/* Alert is shown programmatically via controller — placeholder */}
      <div style={{ display: 'none' }} data-testid="alert-placeholder" />
    </IonModal>
  );
};

// ─── Link (RN Link -> IonRouterLink) ─────────────────────────────────────────

interface IonicLinkProps {
  href?: string;
  onPress?: () => void;
  style?: StyleProp<RNTextStyle>;
  className?: string;
  children?: React.ReactNode;
  testID?: string;
  [key: string]: any;
}

/**
 * IonicLink — wraps IonRouterLink for RN Link behavior.
 */
export const Link = forwardRef<HTMLAnchorElement, IonicLinkProps>(
  ({ href, onPress, style, className, children, testID, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNTextStyle))
      : convertStyle(style as RNTextStyle);

    return (
      <a
        ref={ref}
        href={href}
        className={className}
        data-testid={testID}
        style={{ ...resolvedStyle, cursor: 'pointer' }}
        onClick={(e) => {
          if (href) return; // Let native navigation handle it
          e.preventDefault();
          onPress?.();
        }}
        {...rest}
      >
        {children}
      </a>
    );
  },
);

Link.displayName = 'Link';

// ─── FlatList (placeholder for list rendering) ───────────────────────────────

interface FlatListProps<T> {
  data?: readonly T[];
  renderItem?: ({ item, index, separators }: { item: T; index: number; separators: any }) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  style?: StyleProp<RNStyle>;
  className?: string;
  testID?: string;
  numColumns?: number;
  horizontal?: boolean;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  key?: string;
  [key: string]: any;
}

/**
 * FlatList — renders a flat list from data array.
 * Placeholder: use IonList + IonItem for full Ionic features.
 */
export function FlatList<T = any>({
  data = [],
  renderItem,
  keyExtractor,
  style,
  className,
  testID,
  horizontal,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onEndReached,
  ...rest
}: FlatListProps<T>) {
  const resolvedStyle = Array.isArray(style)
    ? style.map(s => convertStyle(s as RNStyle))
    : convertStyle(style as RNStyle);

  const keys = data.map((item, index) => keyExtractor?.(item, index) ?? String(index));

  return (
    <div
      className={className}
      data-testid={testID}
      style={resolvedStyle}
      {...rest}
    >
      {ListHeaderComponent}
      {data.length === 0 && ListEmptyComponent}
      {data.map((item, index) => (
        <div
          key={keys[index]}
          style={horizontal ? { display: 'inline-block', flexShrink: 0 } : undefined}
        >
          {renderItem?.({ item, index, separators: {} })}
        </div>
      ))}
      {ListFooterComponent}
    </div>
  );
}

// ─── SectionList (placeholder) ────────────────────────────────────────────────

interface SectionData<T> {
  title: string;
  data: T[];
}

interface SectionListProps<T> {
  sections?: SectionData<T>[];
  renderItem?: ({ item, index, section }: any) => React.ReactNode;
  renderSectionHeader?: ({ section }: { section: SectionData<T> }) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  style?: StyleProp<RNStyle>;
  className?: string;
  testID?: string;
  [key: string]: any;
}

/**
 * SectionList — renders a sectioned list.
 */
export function SectionList<T = any>({
  sections = [],
  renderItem,
  renderSectionHeader,
  keyExtractor,
  style,
  className,
  testID,
  ...rest
}: SectionListProps<T>) {
  const resolvedStyle = Array.isArray(style)
    ? style.map(s => convertStyle(s as RNStyle))
    : convertStyle(style as RNStyle);

  return (
    <div className={className} data-testid={testID} style={resolvedStyle} {...rest}>
      {sections.map((section, sectionIndex) => (
        <React.Fragment key={sectionIndex}>
          {renderSectionHeader?.({ section })}
          {section.data.map((item, index) => {
            const key = keyExtractor?.(item, index) ?? `${sectionIndex}-${index}`;
            return <div key={key}>{renderItem?.({ item, index: sectionIndex * 1000 + index, section })}</div>;
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── TouchableWithoutFeedback ─────────────────────────────────────────────────

interface TouchableWithoutFeedbackProps {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<RNStyle>;
  children?: React.ReactNode;
  testID?: string;
  [key: string]: any;
}

/**
 * TouchableWithoutFeedback — wraps a div with touch events but no visual feedback.
 */
export const TouchableWithoutFeedback = forwardRef<HTMLDivElement, TouchableWithoutFeedbackProps>(
  ({ style, onPress, onPressIn, onPressOut, onLongPress, testID, children, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    return (
      <div
        ref={ref}
        data-testid={testID}
        style={resolvedStyle}
        onClick={onPress}
        onMouseDown={onPressIn}
        onMouseUp={onPressOut}
        onMouseLeave={onPressOut}
        onContextMenu={(e) => {
          e.preventDefault();
          onLongPress?.();
        }}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

TouchableWithoutFeedback.displayName = 'TouchableWithoutFeedback';

// ─── TouchableNativeFeedback (placeholder) ────────────────────────────────────

interface TouchableNativeFeedbackProps {
  onPress?: () => void;
  style?: StyleProp<RNStyle>;
  children?: React.ReactNode;
  testID?: string;
  [key: string]: any;
}

/**
 * TouchableNativeFeedback — wraps TouchableOpacity with ripple effect on Android.
 * On web, behaves like TouchableOpacity.
 */
export const TouchableNativeFeedback = forwardRef<HTMLButtonElement, TouchableNativeFeedbackProps>(
  ({ style, onPress, testID, children, ...rest }, ref) => {
    const resolvedStyle = Array.isArray(style)
      ? style.map(s => convertStyle(s as RNStyle))
      : convertStyle(style as RNStyle);

    return (
      <button
        ref={ref}
        data-testid={testID}
        style={{ ...resolvedStyle, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
        onClick={onPress}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

TouchableNativeFeedback.displayName = 'TouchableNativeFeedback';

// ─── Pressable (RN 0.74+ replacement for TouchableOpacity) ───────────────────

interface PressableProps {
  style?: StyleProp<RNStyle> | ((state: { pressed: boolean }) => StyleProp<RNStyle>);
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLongPress?: () => void;
  delayPressIn?: number;
  delayPressOut?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  testID?: string;
  [key: string]: any;
}

/**
 * Pressable — modern RN component for press handling.
 * Maps directly to TouchableOpacity on web.
 */
export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  ({ style, onPress, onPressIn, onPressOut, onLongPress, delayPressIn, delayPressOut, disabled = false, testID, children, ...rest }, ref) => {
    const resolvedStyle = typeof style === 'function'
      ? (style as (state: { pressed: boolean }) => StyleProp<RNStyle>)(
          { pressed: false }
        )
      : style;

    const finalStyle = Array.isArray(resolvedStyle)
      ? resolvedStyle.map(s => convertStyle(s as RNStyle))
      : convertStyle(resolvedStyle as RNStyle);

    return (
      <button
        ref={ref}
        className={testID ? `pressable-${testID}` : undefined}
        data-testid={testID}
        disabled={disabled}
        style={[
          finalStyle,
          {
            cursor: disabled ? 'not-allowed' : 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0,
          },
        ]}
        onClick={onPress}
        onMouseDown={onPressIn}
        onMouseUp={onPressOut}
        onMouseLeave={onPressOut}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Pressable.displayName = 'Pressable';

// ─── Dimensions (RN Dimensions -> web window) ─────────────────────────────────

export const Dimensions = {
  getWindowDimensions: () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: window.devicePixelRatio || 1,
    fontScale: 1,
  }),
  getScreenDimensions: () => ({
    width: window.screen.width,
    height: window.screen.height,
    scale: window.devicePixelRatio || 1,
  }),
  addEventListener: (_type: string, _listener: () => void) => {
    // No-op on web — window resize events not exposed
  },
  removeEventListener: (_type: string, _listener: () => void) => {
    // No-op on web
  },
};

// ─── Platform (already from react-native but re-exported) ─────────────────────

// Platform is handled by CSS
const Platform = {
  OS: 'web' as const,
  select: (val: any) => val.web,
};
export { Platform };


// ─── Barrel exports ───────────────────────────────────────────────────────────


// ─── Keyboard (web compatible) ──────────────────────────────────────────────
export const Keyboard = {
  dismiss: () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  },
  addListener: (_type: string, _listener: () => void) => () => {},
  removeListener: (_type: string, _listener: () => void) => {},
  isEventWithinHapticRegion: () => true,
};

// ─── Animated (web compatible stub) ─────────────────────────────────────────
export const Animated = {
  value: (initialValue: number) => ({ value: initialValue }),
  timing: (_value: any, _config: any) => ({ start: (callback: () => void) => callback() }),
  spring: (_value: any, _config: any) => ({ start: (callback: () => void) => callback() }),
  delay: (_ms: number, animation: any) => animation,
  sequence: (animations: any[]) => ({ start: (callback: () => void) => { for (const a of animations) { if (a.start) a.start(); } callback(); } }),
};

// ─── Easing (web compatible) ────────────────────────────────────────────────
export const Easing = {
  linear: () => (t: number) => t,
  ease: () => (t: number) => t * (2 - t),
  quad: () => (t: number) => t * t,
  cubic: () => (t: number) => t * t * t,
};


// ─── TextInput (web compatible) ────────────────────────────────────────────
export const TextInput = React.forwardRef<HTMLTextAreaElement, any>(({
  style,
  placeholder,
  placeholderTextColor,
  multiline = false,
  numberOfLines,
  value,
  onChangeText,
  ...rest
}, ref) => {
  const { colors } = useAppTheme();
  return (
    <textarea
      ref={ref}
      placeholder={placeholder}
      style={[
        {
          width: '100%',
          minHeight: multiline ? 100 : 44,
          padding: 12,
          borderRadius: 12,
          fontSize: 16,
          color: colors.textPrimary,
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          fontFamily: 'inherit',
          resize: 'none',
        },
        ...(Array.isArray(style) ? style : [style]),
      ] as any}
      value={value}
      onChange={(e) => onChangeText?.(e.target.value)}
      {...rest}
    />
  );
});
TextInput.displayName = 'TextInput';

