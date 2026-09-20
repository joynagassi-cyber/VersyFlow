# VersyFlow — UI Rulebook

> Règles pour les composants et écrans React Native
> Application: docs/06-design-system.md, docs/07-design-tokens.md, docs/08-ui-screens.md

---

## 1. Règles des Composants

### UC-1: Pure Functional Components
Les composants doivent être des fonctions pures qui reçoivent des props et rendent du JSX.

```typescript
// ✅ CORRECT
function Button({ onPress, title }: ButtonProps) {
  return <TouchableOpacity onPress={onPress}>{/* ... */}</TouchableOpacity>;
}

// ❌ INCORRECT — State management dans le composant
function Button() {
  const [loading, setLoading] = useState(false); // Use a hook instead
  // ...
}
```

### UC-2: Props Minimalism
Ne recevoir que les props nécessaires. Eviter le prop drilling.

```typescript
// ✅ CORRECT
interface ButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  loading?: boolean;
}

// ❌ INCORRECT — Trop de props détaillées
interface BadButtonProps {
  onPress: () => void;
  title: string;
  color: string;     // Should be from tokens
  fontSize: number;  // Should be from tokens
  borderRadius: number; // Should be from tokens
}
```

### UC-3: No Business Logic
AUCUNE logique métier dans un composant.

```typescript
// ✅ CORRECT — Hook extrait la logique
import { useMemorizationSession } from '@/hooks/useMemorizationSession';

function SessionScreen() {
  const { state, actions } = useMemorizationSession();
  // Only presentation here
  return <View>{/* ... */}</View>;
}

// ❌ INCORRECT — Domaine call directement
function SessionScreen() {
  const status = memorizationDomain.calculateStatus(verse);
  return <View>{/* ... */}</View>;
}
```

---

## 2. Règles des Écrans

### UE-1: Navigation Declarative
Toujours utiliser Expo Router pour la navigation.

```typescript
// ✅ CORRECT
import { useRouter } from 'expo-router';

function HomeScreen() {
  const router = useRouter();
  return <Button onPress={() => router.push('/explore')} />;
}

// ❌ INCORRECT — Navigation imperatif
import { NavigationContainer } from '@react-navigation/native';
```

### UE-2: Écran → Store Only via Hooks
Les écrans ne communiquent avec le store QUE via des hooks custom.

```typescript
// ✅ CORRECT
import { useSettingsStore } from '@/store/settings-store';

function SettingsScreen() {
  const language = useSettingsStore(s => s.language);
  const setLanguage = useSettingsStore(s => s.setLanguage);
  return <Button onPress={() => setLanguage('en')} />;
}

// ❌ INCORRECT — Accès direct au store
import { useSettingsStore } from '@/store/settings-store';

function SettingsScreen() {
  const state = useSettingsStore.getState(); // Never call .getState() in render!
  return <Text>{state.language}</Text>;
}
```

### UE-3: Screen Structure Standard
Chaque écran doit suivre une structure cohérente.

```typescript
function MyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <HeaderBar title="Title" onBack={() => router.back()} />
      
      {/* Content - ScrollView if needed */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main content */}
      </ScrollView>
      
      {/* Footer Actions - fixed at bottom if needed */}
      <View style={styles.footer}>
        <ButtonPrimary title="Action" onPress={handleAction} />
      </View>
    </SafeAreaView>
  );
}
```

---

## 3. Règles d'Accessibilité

### UA-1: Accessible Labels
Tous les boutons et éléments interactifs doivent avoir des labels accessibles.

```typescript
// ✅ CORRECT
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Mémoriser ce verset"
  accessibilityRole="button"
  onPress={handleMemorize}
/>

// ❌ INCORRECT — Pas de label accessible
<TouchableOpacity onPress={handleMemorize}>
  <Icon name="memorize" />
</TouchableOpacity>
```

### UA-2: Color Contrast
Respecter WCAG 2.1 AA minimum:
- Texte normal: contraste ≥ 4.5:1
- Texte large (≥ 18pt): contraste ≥ 3:1

### UA-3: Dynamic Type
Supporter le scaling dynamique jusqu'à 200%.

```typescript
// ✅ CORRECT — Utiliser des fontes relatives
<Text style={{ fontSize: typography.sizes.base * scalingFactor }}>
  Verse text
</Text>

// ❌ INCORRECT — Taille fixe
<Text style={{ fontSize: 16 }}>Verse text</Text>
```

---

## 4. Règles de Design System

### DS-1: Tokens Uniquement
Toujours utiliser les tokens du design system. Jamais de valeurs hardcoded.

```typescript
// ✅ CORRECT
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[50],
    padding: spacing.md,
    borderRadius: radius.md,
  },
});

// ❌ INCORRECT
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF0F6', // Hardcoded token
    padding: 16,                 // Hardcoded spacing
  },
});
```

### DS-2: Shadows System
Utiliser les shadows définis dans les tokens.

```typescript
// ✅ CORRECT
const styles = StyleSheet.create({
  card: {
    ...shadows.md,
  },
});

// ❌ INCORRECT
shadowColor: '#000',              // Not from tokens
shadowOffset: { width: 0, height: 4 }, // Not from tokens
```

---

## 5. Règles d'Animations

### AN-1: Reanimated pour Animations Complexes
Utiliser react-native-reanimated pour toutes les animations complexes.

```typescript
// ✅ CORRECT
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';

const scale = useSharedValue(1);
useEffect(() => {
  scale.value = withSpring(0.96);
}, []);

// ❌ INCORRECT — StyleSheet seule pour les animations complexes
```

### AN-2: Respect Reduced Motion
Toujours respecter les préférences utilisateur.

```typescript
// ✅ CORRECT
import { useReducedMotion } from 'react-native-reanimated';

function MyComponent() {
  const shouldReduce = useReducedMotion();
  
  if (shouldReduce) {
    return <SimpleView />;
  }
  
  return <AnimatedView {...otherProps} />;
}

// ❌ INCORRECT — Toujours animer
```

---

## 6. Règles de Performance

### PR-1: Memoization
Toumer memoiser les composants lourds.

```typescript
// ✅ CORRECT
export const HeavyList = React.memo(({ items }: { items: Item[] }) => {
  return <FlatList data={items} renderItem={renderItem} />;
});

// ❌ INCORRECT — Recréé à chaque render
export function HeavyList({ items }: { items: Item[] }) {
  return <FlatList data={items} renderItem={renderItem} />;
}
```

### PR-2: Virtualisation
Toujours virtualiser les listes > 20 items.

```typescript
// ✅ CORRECT — FlashList pour grandes listes
import { FlashList } from '@shopify/flash-list';

<FlashList 
  data={verses} 
  renderItem={renderItem}
  estimatedItemSize={80}
/>

// ❌ INCORRECT — FlatList sans keyExtractor
<FlatList data={verses} renderItem={renderItem} />
```

---

*Ce rulebook complète docs/06-design-system.md et docs/08-ui-screens.md. Il s'applique à TOUS les écrans et composants.*
