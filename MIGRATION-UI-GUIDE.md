# React Native to Ionic Migration Guide

This guide maps every React Native component import used in VersyFlow to its Ionic-compatible replacement.
All primitives are re-exported from `@/components/ui/Primitives`.

## Quick Import

```typescript
// Before (React Native)
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';

// After (Ionic primitives)
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image
} from '@/components/ui/Primitives';
```

## Core Components

| React Native | Ionic Primitive | Underlying Element | Notes |
|---|---|---|---|
| `View` | `View` | `<div>` | Flex-based, same style API |
| `Text` | `Text` | `<span>` | Token-based typography preserved |
| `TouchableOpacity` | `TouchableOpacity` | `<button>` | `activeOpacity` -> CSS opacity transition |
| `Pressable` | `Pressable` | `<button>` | Supports functional style prop |
| `TouchableWithoutFeedback` | `TouchableWithoutFeedback` | `<div>` | No visual feedback |
| `TouchableNativeFeedback` | `TouchableNativeFeedback` | `<button>` | Android ripple placeholder |
| `ScrollView` | `ScrollView` | `<IonContent>` | Scroll events mapped to `onIonScroll` |
| `FlatList` | `FlatList` | `<div>` | Placeholder; use `IonList` for production |
| `SectionList` | `SectionList` | `<div>` | Placeholder |
| `Image` | `Image` | `<img>` | `source.uri` maps to `src` |
| `ActivityIndicator` | `ActivityIndicator` | `<IonSpinner>` | `size: 'small'|'large'|number` |
| `Modal` | `Modal` | `<IonModal>` | `animationType: 'slide'|'fade'|'none'` |
| `Alert` | `Alert` | (placeholder) | Use `IonAlert` controller for production |
| `Link` | `Link` | `<a>` | `href` or `onPress` |

## Layout & Safe Area

| React Native | Ionic Primitive | Underlying Element |
|---|---|---|
| `SafeAreaView` | `SafeAreaView` | `<div>` with `env(safe-area-inset-*)` |
| `KeyboardAvoidingView` | `KeyboardAvoidingView` | `<div>` with paddingBottom |
| `StatusBar` | `StatusBar` | No-op on web |

## Styles

| React Native | Ionic Primitive | Notes |
|---|---|---|
| `StyleSheet.create({...})` | `StyleSheet.create({...})` | Outputs CSS-in-JS objects |
| `StyleSheet.flatten(...)` | — | Use `style` prop directly with arrays |
| `PixelRatio.get()` | `Dimensions.getWindowDimensions().scale` | |
| `PixelRatio.getFontScale()` | `Dimensions.getWindowDimensions().fontScale` | |

## Dimensions

| React Native | Ionic Primitive | Notes |
|---|---|---|
| `Dimensions.get('window')` | `Dimensions.getWindowDimensions()` | Returns `{ width, height, scale, fontScale }` |
| `Dimensions.get('screen')` | `Dimensions.getScreenDimensions()` | |
| `Dimensions.addEventListener()` | — | No-op on web |
| `Dimensions.removeEventListener()` | — | No-op on web |

## Platform

| React Native | Ionic Primitive |
|---|---|
| `Platform.OS` | `Platform.OS` (re-exported) |
| `Platform.select({...})` | `Platform.select({...})` |

## Component Migration Cheatsheet

### HeaderBar.tsx
```typescript
// Before
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

// After — zero changes needed
import { StyleSheet, View, Text, TouchableOpacity } from '@/components/ui/Primitives';
```

### ButtonPrimary.tsx
```typescript
// Before
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native';

// After — zero changes needed
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from '@/components/ui/Primitives';
```

### ButtonSecondary.tsx
```typescript
// Before
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

// After — zero changes needed
import { StyleSheet, Text, TouchableOpacity } from '@/components/ui/Primitives';
```

### EmptyState.tsx
```typescript
// Before
import { StyleSheet, View, Text } from 'react-native';

// After — zero changes needed
import { StyleSheet, View, Text } from '@/components/ui/Primitives';
```

### StatCard.tsx
```typescript
// Before
import { StyleSheet, View, Text } from 'react-native';

// After — zero changes needed
import { StyleSheet, View, Text } from '@/components/ui/Primitives';
```

### TabNavigation.tsx
```typescript
// Before
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

// After — zero changes needed
import { StyleSheet, View, Text, TouchableOpacity } from '@/components/ui/Primitives';
```

## Native-Only Components (No Ionic Equivalent)

These React Native components have no web equivalent and require platform-specific handling:

| Component | Replacement Strategy |
|---|---|
| `AppState` | Use `document.visibilitychange` events |
| `BackHandler` | Use browser `popstate` / history API |
| `Clipboard` | Use `navigator.clipboard` API |
| `NetInfo` | Use `navigator.onLine` |
| `Vibration` | Use `navigator.vibrate()` |
| `PanResponder` | Use pointer events or `@use-gesture/react` |
| `Vibration` | Use `navigator.vibrate()` |

## Style Conversion Reference

React Native style properties map to CSS as follows:

| RN Property | CSS Property | Notes |
|---|---|---|
| `flex` | `flex` | Same |
| `flexDirection: 'row'` | `flexDirection: 'row'` | Same |
| `flexDirection: 'column'` | `flexDirection: 'column'` | Same |
| `justifyContent` | `justifyContent` | Same |
| `alignItems` | `alignItems` | Same |
| `margin` / `padding` | `margin` / `padding` | Numbers -> `px` |
| `borderRadius` | `borderRadius` | Numbers -> `px` |
| `borderWidth` | `borderWidth` | Numbers -> `px` |
| `borderColor` | `borderColor` | Same |
| `backgroundColor` | `backgroundColor` | Same |
| `opacity` | `opacity` | Same |
| `shadowColor` | `boxShadow` | Auto-converted |
| `elevation` | `boxShadow` | Mapped to shadow |
| `numberOfLines` | `-webkit-line-clamp` | Requires `overflow: hidden` |
| `fontSize` | `fontSize` | Numbers -> `px` |
| `fontWeight` | `fontWeight` | Same |
| `fontFamily` | `fontFamily` | Same |
| `lineHeight` | `lineHeight` | Numbers -> `px` |
| `letterSpacing` | `letterSpacing` | Numbers -> `px` |
| `color` | `color` | Same |
| `textAlign` | `textAlign` | Same |

## Migration Steps

1. **Phase 1 — Barrel Import**: Change all RN imports to `@/components/ui/Primitives`
2. **Phase 2 — Verify**: Run app, confirm all screens render correctly
3. **Phase 3 — Native**: Introduce real `<IonPage>`, `<IonContent>`, `<IonHeader>` where appropriate
4. **Phase 4 — Replace**: Swap primitive wrappers for native Ionic components one by one
5. **Phase 5 — Clean**: Remove `Primitives.tsx` after full migration

## Important Notes

- All existing code that imports from `react-native` continues to work — just change the import source
- The `StyleSheet` API is fully compatible with `StyleSheet.create()`
- Dark mode is preserved through `useTheme()` hook
- No runtime cost — wrappers are lightweight and use standard DOM/Ionic elements
- Platform-specific styles (`Platform.select`) continue to work
