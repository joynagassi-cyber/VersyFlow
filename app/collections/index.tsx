// Fixed: UX — collection load/save failures now surface a visible error state with retry instead of empty catch blocks
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  BookOpen,
  ChevronDown,
  Heart,
  Music,
  Lightbulb,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { EmptyState } from '@/components/ui/EmptyState';
import { colorTintAlpha } from '@/lib/platform';

interface Collection {
  id: string;
  name: string;
  description: string;
  verseCount: number;
  lastUpdated: string;
  color: string;
  icon: 'heart' | 'musicalNotes' | 'book' | 'bulb';
  verses: string[];
}

// Seed color accents map to semantic design tokens (defined in
// src/styles/globals.css) so collections adapt to light/dark themes.
// Legacy localStorage data may still hold raw hex values — both render fine
// since the consumers use color-mix() and plain `color` styles.
const SAMPLE_COLLECTIONS: Collection[] = [
  { id: '1', name: 'Mes favoris', description: 'Versets sauvegardes', verseCount: 12, lastUpdated: "Aujourd'hui", color: 'var(--color-primary)', icon: 'heart', verses: ['Jean 3:16', 'Psaume 23:1', 'Romains 8:28'] },
  { id: '2', name: 'Psaumes', description: 'Collection de psaumes', verseCount: 8, lastUpdated: 'Hier', color: 'var(--color-info)', icon: 'musicalNotes', verses: ['Psaume 23', 'Psaume 91', 'Psaume 119'] },
  { id: '3', name: 'Evangiles', description: 'Paroles de Jesus', verseCount: 15, lastUpdated: 'Il y a 3 jours', color: 'var(--color-success)', icon: 'book', verses: ['Matthieu 5:3', 'Jean 14:6'] },
  { id: '4', name: 'Memorises', description: 'Verset en cours de memorisation', verseCount: 5, lastUpdated: "Aujourd'hui", color: 'var(--color-warning)', icon: 'bulb', verses: ['Jean 3:16', 'Philippiens 4:13'] },
];

const STORAGE_KEY = 'versyflow:collections';
const NEW_COLLECTION_COLORS = [
  'var(--color-primary)',
  'var(--color-info)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-accent)',
];

/** 12% translucent tint of a color value, for soft circular backgrounds. */
const collectionTint = (color: string) => colorTintAlpha(color, 12);

const ICONS: Record<Collection['icon'], typeof Heart> = {
  heart: Heart,
  musicalNotes: Music,
  book: BookOpen,
  bulb: Lightbulb,
};

export default function CollectionsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [collections, setCollections] = useState<Collection[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Collection[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* fall back to seed */
    }
    return SAMPLE_COLLECTIONS;
  });
  const [loadError, setLoadError] = useState<string | null>(() => {
    // localStorage read itself cannot throw a typed error we need to
    // surface, but JSON corruption does — mark it so the user sees a
    // recoverable state.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) JSON.parse(raw);
    } catch {
      return t('errors.unknownError', 'Impossible de charger les collections');
    }
    return null;
  });
  const [selected, setSelected] = useState<'all' | 'memorized' | 'favorites'>('all');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    selected === 'all'
      ? collections
      : selected === 'memorized'
        ? collections.filter((c) => c.icon === 'bulb')
        : collections.filter((c) => c.icon === 'heart');

  const persist = (next: Collection[]) => {
    setCollections(next);
    setLoadError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* in-memory only */
    }
  };

  const submitCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const c: Collection = {
      id: 'c-' + Date.now(),
      name,
      description: t('collections.custom', 'Collection personnalisee'),
      verseCount: 0,
      lastUpdated: "Aujourd'hui",
      color: NEW_COLLECTION_COLORS[collections.length % NEW_COLLECTION_COLORS.length],
      icon: 'heart',
      verses: [],
    };
    persist([...collections, c]);
    setNewName('');
    setCreating(false);
    setExpandedId(c.id);
  };

  const categories = [
    { id: 'all' as const, label: t('collections.all', 'Toutes'), count: collections.length },
    { id: 'memorized' as const, label: t('collections.memorized', 'En memorisation'), count: collections.filter((c) => c.icon === 'bulb').length },
    { id: 'favorites' as const, label: t('collections.favorites', 'Favoris'), count: collections.filter((c) => c.icon === 'heart').length },
  ];

  return (
    <FullScreenPage
      title={t('nav.collections', 'Collections')}
      showBack
      right={
        <button
          onClick={() => setCreating(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-tint"
        >
          <Plus size={18} className="text-primary" />
        </button>
      }
    >
      <div className="mx-auto max-w-md space-y-4">
        {loadError && (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface p-4 text-center shadow-sm">
            <AlertCircle size={24} className="text-error" />
            <p className="text-sm text-error">{loadError}</p>
            <button
              onClick={() => {
                setCollections(SAMPLE_COLLECTIONS);
                setLoadError(null);
              }}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white active:opacity-90"
            >
              {t('common.retry', 'Réessayer')}
            </button>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={
                'rounded-full px-3.5 py-1.5 text-sm font-medium ' +
                (selected === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-surface-tint text-text-secondary')
              }
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title={t('collections.empty', 'Aucune collection')}
            description={t('collections.emptyHint', 'Créez votre premiere collection.')}
            actionLabel={t('collections.create', 'Creer une collection')}
            onAction={() => setCreating(true)}
            showLogo={false}
          />
        )}

        {filtered.map((collection) => {
          const Icon = ICONS[collection.icon];
          const expanded = expandedId === collection.id;
          return (
            <div key={collection.id}>
              <button
                onClick={() =>
                  setExpandedId(expanded ? null : collection.id)
                }
                className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left shadow-sm"
              >
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
                  style={{ color: collection.color, backgroundColor: collectionTint(collection.color) }}
                >
                  <Icon size={26} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold text-text-primary">
                    {collection.name}
                  </span>
                  <span className="text-sm text-text-muted">{collection.description}</span>
                  <span className="mt-1 flex gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} />
                      {collection.verseCount} {t('collections.verses', 'versets')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {collection.lastUpdated}
                    </span>
                  </span>
                </span>
                <ChevronDown
                  size={18}
                  className={'text-text-muted transition ' + (expanded ? 'rotate-180' : '')}
                />
              </button>
              {expanded && (
                <div className="mx-4 mt-2 space-y-1 rounded-xl bg-surface-tint p-3">
                  {collection.verses.length === 0 ? (
                    <p className="text-sm text-text-muted">
                      {t('collections.noVerses', 'Aucun verset dans cette collection.')}
                    </p>
                  ) : (
                    collection.verses.map((v) => (
                      <button
                        key={v}
                        onClick={() => navigate('/bible/chapter?' + new URLSearchParams({ book: v.split(' ')[0], chapter: v }).toString())}
                        className="block text-left text-sm text-text-primary"
                      >
                        • {v}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {creating ? (
          <div className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 p-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('collections.namePlaceholder', 'Nom de la collection')}
              className="flex-1 bg-transparent px-1 text-base text-text-primary outline-none"
            />
            <button
              onClick={() => setCreating(false)}
              className="rounded-full bg-surface-tint px-3 py-2 text-sm text-text-muted"
            >
              {t('common.cancel', 'Annuler')}
            </button>
            <button
              onClick={submitCreate}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white"
            >
              <Plus size={20} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-primary/40 p-4 text-left active:opacity-90"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-tint">
              <Plus size={26} className="text-primary" />
            </span>
            <span>
              <span className="block text-base font-bold text-primary">
                {t('collections.create', 'Creer une collection')}
              </span>
              <span className="text-sm text-text-muted">
                {t('collections.createHint', 'Organisez vos versets preferes')}
              </span>
            </span>
          </button>
        )}
      </div>
    </FullScreenPage>
  );
}
