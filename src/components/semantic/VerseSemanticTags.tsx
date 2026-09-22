/**
 * VerseSemanticTags — concept tag chips rendered under a verse
 *
 * Presentation only: takes pre-resolved concepts (already locale-labeled)
 * and renders calm, hierarchical chips. Each chip links to the concept's
 * semantic tree view (`/semantic/concept`). No business logic here.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit } from 'lucide-react';
import type { Concept } from '@/domains/semantic-memory';
import { conceptLabel } from '@/hooks/useSemanticTags';

interface VerseSemanticTagsProps {
  concepts: Concept[];
}

export default function VerseSemanticTags({
  concepts,
}: VerseSemanticTagsProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language ?? 'fr';

  if (concepts.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {concepts.map((c) => (
        <button
          key={c.id}
          onClick={() =>
            navigate(`/semantic/concept?conceptId=${encodeURIComponent(c.id)}`)
          }
          className="inline-flex items-center gap-1 rounded-full bg-surface-tint px-2.5 py-1 text-xs font-semibold text-primary transition-transform active:scale-[0.98]"
        >
          <BrainCircuit size={11} />
          {conceptLabel(c, lang)}
        </button>
      ))}
    </div>
  );
}
