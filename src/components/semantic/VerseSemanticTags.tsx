/**
 * VerseSemanticTags — concept tag chips rendered under a verse
 *
 * Presentation only: takes pre-resolved concepts (already locale-labeled)
 * and renders calm, hierarchical chips. Each chip links to the concept's
 * semantic tree view (`/semantic/concept`). No business logic here.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, UserRound } from 'lucide-react';
import type { Concept } from '@/domains/semantic-memory';
import { conceptLabel } from '@/hooks/useSemanticTags';
import { cn } from '@/lib/utils';

interface VerseSemanticTagsProps {
  concepts: Concept[];
  /**
   * When set, chips whose concept was manually tagged by the user
   * (`source = 'user'`) get the personal accent.
   */
  userSource?: boolean;
}

export default function VerseSemanticTags({
  concepts,
  userSource,
}: VerseSemanticTagsProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';

  if (concepts.length === 0) return null;

  const isUserConcept = (c: Concept): boolean =>
    c.source_provenance?.some((p) => p.source === 'user') ?? false;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {concepts.map((c) => {
        const personal = userSource && isUserConcept(c);
        return (
          <button
            key={c.id}
            onClick={() =>
              navigate(`/semantic/concept?conceptId=${encodeURIComponent(c.id)}`)
            }
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-transform active:scale-[0.98]',
              personal
                ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
                : 'bg-surface-tint text-primary',
            )}
          >
            {personal ? <UserRound size={11} /> : <BrainCircuit size={11} />}
            {conceptLabel(c, lang)}
          </button>
        );
      })}
    </div>
  );
}
