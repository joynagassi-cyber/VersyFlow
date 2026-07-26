# VersyFlow — Internationalisation (i18n)

## Document généré par Agent G — Internationalisation

---

## 1. Stratégie i18n Globale

### Principe Fondamental
Deux systèmes d'internationalisation **complètement indépendants**:

1. **Langue de l'interface (UILanguage)**: textes de l'application entière
2. **Traduction biblique (BibleTranslation)**: contenu des versets

Ces deux choix sont orthogonaux et modifiables à tout moment dans les paramètres.

### Distinction Critique
- **UI Language** = COMMENT l'utilisateur interagit avec l'app
- **Bible Translation** = QUEL contenu biblique l'utilisateur voit
- Ces deux sélectionssont **jamais couplées**
- Chacune a son propre système de stockage, de selection, de fallback

---

## 2. Langues Supportées au MVP

### Liste des Langues

| Code | Nom natif | Nom en français | RTL | Priorité |
|------|-----------|-----------------|-----|----------|
| fr | Français | French | Non | MUST |
| en | English | Anglais | Non | MUST |
| ar | العربية | Arabe | OUI | MUST |
| de | Deutsch | Allemand | Non | SHOULD |
| zh | 中文 | Chinois (simplifié) | Non | SHOULD |

### Nombres de clés de traduction par langue
Environ 150-200 clés de traduction pour le MVP (estimé après specification screens).

---

## 3. Structure des Fichiers

```
src/i18n/
├── locales/
│   ├── fr.json        ← Traductions de l'interface (FR)
│   ├── en.json        ← Traductions de l'interface (EN)
│   ├── ar.json        ← Traductions de l'interface (AR)
│   ├── de.json        ← Traductions de l'interface (DE)
│   └── zh.json        ← Traductions de l'interface (ZH)
├── config.ts          ← Configuration i18n (supported languages, defaults)
├── directions.ts      ← RTL/LTR detection logic
├── hooks.ts           ← Custom hook useI18n() and t() function
└── types.ts           ← TypeScript types for keys and values
```

### Exemple de fichier de locale (fr.json)
```json
{
  "common": {
    "appName": "VersyFlow",
    "continue": "Continuer",
    "skip": "Passer",
    "back": "Retour",
    "done": "Terminé",
    "loading": "Chargement...",
    "error": "Erreur",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "delete": "Supprimer"
  },
  "onboarding": {
    "welcome": "Bienvenue dans VersyFlow",
    "selectLanguage": "Choisissez votre langue",
    "selectTranslation": "Choisissez votre traduction biblique",
    "rtlWarning": "L'interface passera en lecture droite-gauche",
    "startingVerse": "Un verset qui change la vie",
    "slide1Title": "Choisissez votre traduction",
    "slide1Desc": "Parmi les traductions bibliques disponibles",
    "slide2Title": "Mémorisez avec science",
    "slide2Desc": "Algorithme FSRS optimisé en Rust",
    "slide3Title": "Suivez votre progression",
    "slide3Desc": "Statistiques détaillées et série quotidienne"
  },
  "home": {
    "greeting": "Bonjour",
    "reviewDue": "{count} verset{plural} à réviser",
    "streak": "{count} jour{plural} de suite!",
    "explore": "Explorer la Bible",
    "dailyVerse": "Verset du jour",
    "noReviews": "Tout est à jour! ✓",
    "goodJob": "Excellent travail"
  },
  "bible": {
    "explorer": "Explorer la Bible",
    "book": "Livre",
    "chapter": "Chapitre",
    "verse": "Verset",
    "memorize": "Mémoriser ce verset",
    "favorite": "Ajouter aux favoris",
    "search": "Rechercher une référence...",
    "oldTestament": "Ancien Testament",
    "newTestament": "Nouveau Testament",
    "verseCount": "{count} verset{plural}",
    "chapterCount": "{count} chapitre{plural}"
  },
  "session": {
    "memorizing": "Mémorisation",
    "allWordsRevealed": "Tous les mots ont été révélés",
    "iMemorized": "J'ai mémorisé",
    "needMoreTime": "Besoin de plus de temps",
    "tapToReveal": "Appuyez pour révéler",
    "timeElapsed": "Temps: {seconds}s",
    "verseComplete": "Verset mémorisé! ✨",
    "nextReview": "Prochain rappel: dans {days} jour{plural}"
  },
  "review": {
    "todayReviews": "Révisions du jour",
    "overdue": "En retard",
    "dueSoon": "À l'heure",
    "totalDue": "{count} à réviser",
    "estimatedTime": "~{minutes} min",
    "startReview": "Commencer la révision",
    "iRecalled": "J'ai rappelé",
    "almost": "Presque",
    "forgot": "J'ai oublié",
    "correct": "Correct!",
    "summary": "Résumé de session"
  },
  "progress": {
    "yourProgress": "Votre Progression",
    "versesMemorized": "Verset{plural} mémorisé{plural}",
    "inProgress": "En cours",
    "toReview": "À réviser",
    "streak": "Série",
    "retention": "Rétention",
    "thisWeek": "Cette semaine",
    "recentVerses": "Verset{plural} récent{plural}",
    "needsStrengthening": "À renforcer",
    "mastered": "Maîtrisé{plural}"
  },
  "settings": {
    "settings": "Paramètres",
    "uiLanguage": "Langue de l'interface",
    "bibleTranslation": "Traduction biblique",
    "theme": "Thème",
    "light": "Clair",
    "dark": "Sombre",
    "dataManagement": "Données & Stockage",
    "storageUsed": "Stockage utilisé",
    "exportData": "Exporter mes données",
    "about": "À propos",
    "version": "Version",
    "documentation": "Documentation",
    "resetProgress": "Réinitialiser toute la progression",
    "resetConfirmTitle": "Êtes-vous sûr?",
    "resetConfirmText": "Cela supprimera TOUS vos versets mémorisés et historiques.",
    "typeConfirm": "Tapez SUPPRIMER pour confirmer"
  },
  "errors": {
    "translationReset": "Traduction réinitialisée à LSG",
    "verseNotFound": "Verset non disponible dans cette traduction",
    "wasmFailed": "Moteur de révision désactivé. Algorithme simplifié activé.",
    "databaseCorrupt": "Base de données corrompue. Restauration en cours...",
    "unknownError": "Une erreur inattendue s'est produite"
  }
}
```

---

## 4. Hook d'Internationalisation

### Implémentation useI18n
```typescript
// src/i18n/hooks.ts
import { useState, useEffect, useCallback } from 'react';
import { I18nService } from './i18n-service';

export function useI18n() {
  const service = I18nService.getInstance();
  
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    return service.translate(key, params);
  }, []);
  
  const setLanguage = useCallback((lang: string) => {
    service.setLanguage(lang);
  }, []);
  
  const isRTL = service.isRTL();
  
  return { t, setLanguage, isRTL };
}

export { I18nService };
```

### Service i18n
```typescript
// src/i18n/i18n-service.ts
import * as frenchLocales from './locales/fr.json';
import * as englishLocales from './locales/en.json';
// ... etc

const LOCALES: Record<string, unknown> = { fr: frenchLocales, en: englishLocales };
const RTL_LANGUAGES = ['ar', 'he', 'ur'];
const FALLBACK_LANGUAGE = 'en'; // English as global fallback

export class I18nService {
  private language = 'fr';
  private translations: Record<string, string> = {};
  
  translate(key: string, params?: Record<string, string | number>): string {
    let value = this.getNestedValue(this.translations, key);
    
    // Fallback chain: selected → EN → FR → key itself
    if (!value) {
      value = this.fallbackChain(key);
    }
    
    // Apply parameters: "{count} versets" → "3 versets"
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value!.replace(`{${k}}`, String(v));
      });
    }
    
    return value;
  }
  
  setLanguage(lang: string): void {
    this.language = lang;
    this.translations = (LOCALES[lang] || LOCALES[FALLBACK_LANGUAGE]) as Record<string, string>;
    // Update app layout direction for RTL
  }
  
  isRTL(): boolean {
    return RTL_LANGUAGES.includes(this.language);
  }
  
  private fallbackChain(key: string): string {
    if (key in (LOCALES[FALLBACK_LANGUAGE] as object)) {
      return this.getNestedValue(LOCALES[FALLBACK_LANGUAGE], key) || key;
    }
    if (key in (LOCALES['fr'] as object)) {
      return this.getNestedValue(LOCALES['fr'], key) || key;
    }
    return key; // Final fallback: return the key itself
  }
  
  private getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
    return path.split('.').reduce((acc, part) => acc?.[part], obj) as string | undefined;
  }
  
  static getInstance(): I18nService { /* singleton */ }
}
```

---

## 5. Gestion RTL (Right-to-Left)

### Détection automatique
Quand `language === 'ar'` (ou autre langue RTL), `isRTL()` retourne `true`.

### Impact sur l'UI
- **Layout direction**: Tout flexbox passe de `row` à `row-reverse`, de `ltr` à `rtl` padding/margin
- **Navigation push**: Slide from right devient slide from left
- **Icons**: Certains icons doivent être mirrorés (flèche, bookmark)
- **Texte**: Direction du texte forcée en RTL

### Mise en œuvre React Native
```typescript
import { I18nManager } from 'react-native';
import { useI18n } from '@/i18n/hooks';

// In root layout
const { isRTL } = useI18n();
useEffect(() => {
  if (isRTL !== I18nManager.isRTL) {
    I18nManager.forceRTL(isRTL);
  }
}, [isRTL]);
```

### Composants RTL-aware
- Tous les composants doivent utiliser `start`/`end` au lieu de `left`/`right`
- Utiliser Logical Properties CSS-equivalent en RN (marginStart, paddingEnd...)

---

## 6. Pluralisation

Le système supporte le `{plural}` dans les chaînes de traduction:

```json
{
  "reviewDue": "{count} verset{plural} à réviser"
}
```

À l'utilisation:
```typescript
t('home.reviewDue', { count: 1, plural: '' })           // "1 verset à réviser"
t('home.reviewDue', { count: 3, plural: 's' })           // "3 versets à réviser"
t('home.reviewDue', { count: 0, plural: 's' })           // "0 versets à réviser"
```

Note: Pour le MVP, la pluralisation est basique (ajout 's'). Les cas complexes seront gérés par `Intl.PluralRules` en V1+.

---

## 7. Ajout d'une Nouvelle Langue UI

### Processus zero-code-change
1. Créer `src/i18n/{code}.json` en copiant `en.json`
2. Traduire toutes les valeurs (les clés restent identiques)
3. Ajouter le code dans SUPPORTED_LANGUAGES list dans `config.ts`
4. Si RTL: marquer `rtl: true` dans la config
5. Redémarrer l'app → nouvelle langue automatiquement disponible

---

*Document approuvé. Transmis à l'Agent H pour FSRS Domain.*
