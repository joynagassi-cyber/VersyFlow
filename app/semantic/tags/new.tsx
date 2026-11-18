/**
 * Arbres sémantiques — Ajouter des tags (kit `t2_arbre_ajouter_des_tags`).
 *
 * Écrit réellement dans la base sémantique locale via
 * `SemanticService.saveVerseTag` : c'est le même chemin que le bouton
 * « Taguer » du lecteur de verset, donc un tag créé ici apparaît partout
 * ailleurs dans l'app (et inversement).
 *
 * La référence du verset est saisie au format canonique `livre:chapitre:verset`
 * (ex. `joh:3:16`) : c'est la clé indépendante de la traduction, la seule que
 * le domaine accepte.
 */

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tag01Icon as Tag, Tick02Icon as Tick, AlertCircleIcon as AlertCircle } from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Button } from '@/components/ui/button';
import { HintNote, SectionCard } from '@/components/family/FamilyKit';
import { useSemanticIndex, useMyConcepts } from '@/hooks/useSemanticViews';
import { getSemanticService } from '@/services/semantic-query-service';
import { fireAndForget } from '@/lib/fire-and-forget';
import { cn } from '@/lib/utils';

export default function SemanticTagNewScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';
  const { data } = useSemanticIndex();
  const { entries, refresh } = useMyConcepts(60);

  const [verseKey, setVerseKey] = useState('');
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validKey = /^[a-zA-Z0-9]+:\d+:\d+$/.test(verseKey.trim());

  const suggestions = useMemo(() => {
    const base = (data?.featuredConcepts ?? []).map((c) => c.concept.canonical_name);
    const mine = entries.map((e) => e.label);
    const all = Array.from(new Set([...mine, ...base]));
    const q = term.trim().toLowerCase();
    return (q ? all.filter((name) => name.toLowerCase().includes(q)) : all).slice(0, 12);
  }, [data?.featuredConcepts, entries, term]);

  const save = async () => {
    if (!validKey || selected.length === 0) return;
    setBusy(true);
    setError(null);
    const ok: string[] = [];
    try {
      const service = getSemanticService();
      for (const name of selected) {
        await service.saveVerseTag({
          verseKey: verseKey.trim(),
          conceptId: crypto.randomUUID(),
          canonicalName: name,
          role: 'PRIMARY',
          locale: lang,
        });
        ok.push(name);
      }
      setSaved(ok);
      refresh();
      navigate('/semantic/tags', { replace: true });
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('errors.unknownError', 'Une erreur inattendue est survenue'),
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = (name: string) =>
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));

  return (
    <FullScreenPage
      title={t('tree.addTags', 'Ajouter des tags')}
      subtitle={t('tree.subtitle', 'Arbres sémantiques')}
      backPath="/semantic/tags"
    >
      <div className="flex flex-col gap-4">
        <SectionCard title={t('tree.verseRef', 'Référence du verset')}>
          <input
            value={verseKey}
            onChange={(e) => setVerseKey(e.target.value.trim())}
            placeholder={t('tree.verseRefPlaceholder', 'joh:3:16')}
            aria-label={t('tree.verseRef', 'Référence du verset')}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 font-mono text-base text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-2">
            <HintNote>
              {t(
                'tree.verseRefHint',
                'Format livre:chapitre:verset, identique dans toutes les traductions (joh:3:16 = Jean 3:16).',
              )}
            </HintNote>
          </div>
        </SectionCard>

        <SectionCard title={t('tree.concepts', 'Concepts')}>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('tree.searchConcept', 'Rechercher ou créer un concept')}
            aria-label={t('tree.searchConcept', 'Rechercher ou créer un concept')}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((name) => {
              const active = selected.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(name)}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    active ? 'border-primary bg-surface-tint text-primary' : 'border-border text-text-muted',
                  )}
                >
                  {active && <DuoIcon icon={Tick} size={12} />}
                  {name}
                </button>
              );
            })}
            {term.trim() && !suggestions.includes(term.trim()) && (
              <button
                type="button"
                onClick={() => toggle(term.trim())}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary"
              >
                <DuoIcon icon={Tag} size={12} />
                {t('tree.createPersonalTag', 'Créer « {{name}} »', { name: term.trim() })}
              </button>
            )}
          </div>
          {suggestions.length === 0 && !term.trim() && (
            <p className="mt-2 text-xs text-text-muted">
              {t(
                'tree.noBaseConcepts',
                'La base sémantique n’est pas encore installée sur cet appareil : écrivez un nom de concept pour créer le vôtre.',
              )}
            </p>
          )}
        </SectionCard>

        {saved.length > 0 && (
          <HintNote>
            {t('tree.tagsSaved', 'Tags enregistrés : {{names}}', { names: saved.join(', ') })}
          </HintNote>
        )}

        {error && (
          <p className="flex items-center gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
            <DuoIcon icon={AlertCircle} size={14} className="shrink-0" />
            {error}
          </p>
        )}

        <Button
          className="w-full"
          disabled={busy || !validKey || selected.length === 0}
          onClick={() => fireAndForget(save(), 'semantic:save-tags')}
        >
          {t('tree.saveTags', 'Enregistrer · {{count}} tags', { count: selected.length })}
        </Button>
      </div>
    </FullScreenPage>
  );
}
