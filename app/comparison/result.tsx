import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Check } from 'lucide-react';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import { useComparisonCapability } from '@/capabilities/comparison/store';
import type { MemorizationRecord } from '@/domains/memorization/entities';

interface Props {
  record: MemorizationRecord;
  userAnswer: string;
}

export default function ComparisonResultScreen({ record, userAnswer }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { lastVerification, verifyAnswer } = useComparisonCapability();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!verified) {
      verifyAnswer(record.bibleVerseText, userAnswer);
      setVerified(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!lastVerification) {
    return (
      <FullScreenPage title={t('comparison.result', 'Resultat')} showBack>
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <p className="text-sm text-text-muted">
            {t('comparison.analyzing', 'Analyse en cours...')}
          </p>
        </div>
      </FullScreenPage>
    );
  }

  const scoreColor =
    lastVerification.score >= 0.9
      ? 'var(--color-success)'
      : lastVerification.score >= 0.7
        ? 'var(--color-warning)'
        : 'var(--color-error)';

  return (
    <FullScreenPage title={t('comparison.result', 'Resultat')} showBack>
      <div className="mx-auto max-w-md space-y-4">
        {/* Score */}
        <div className="flex flex-col items-center rounded-3xl bg-surface p-6 shadow-sm">
          <p className="text-sm text-text-muted">
            {t('comparison.accuracyScore', 'Score de precision')}
          </p>
          <p className="my-2 text-5xl font-extrabold" style={{ color: scoreColor }}>
            {Math.round(lastVerification.score * 100)}%
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-tint">
            <div
              className="h-full rounded-full"
              style={{ width: lastVerification.score * 100 + '%', backgroundColor: scoreColor }}
            />
          </div>
        </div>

        {/* Substitutions */}
        {lastVerification.substitutedWords.length > 0 && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="mb-2 text-base font-bold text-text-primary">
              {t('comparison.substitutions', 'Substitutions')}
            </p>
            <div className="space-y-2">
              {lastVerification.substitutedWords.map((sub, i) => (
                <p key={i} className="text-sm">
                  <span className="text-text-primary">{sub.expected}</span>
                  <ArrowRight size={12} className="mx-1 inline text-text-muted" />
                  <span className="text-error">{sub.got}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Missing */}
        {lastVerification.missingWords.length > 0 && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="mb-2 text-base font-bold text-text-primary">
              {t('comparison.missingWords', 'Mots manquants')}
            </p>
            <div className="flex flex-wrap gap-2">
              {lastVerification.missingWords.map((word, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-error/10 px-2 py-1 text-sm text-error"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fragile portions */}
        {lastVerification.fragilePortions.length > 0 && (
          <div className="rounded-2xl bg-surface p-4 shadow-sm">
            <p className="mb-2 text-base font-bold text-text-primary">
              {t('comparison.fragilePortions', 'Portions fragiles')}
            </p>
            <div className="space-y-2">
              {lastVerification.fragilePortions.map((portion, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">
                    Positions {portion.start + 1}-{portion.end}
                  </span>
                  <span className="font-semibold" style={{ color: scoreColor }}>
                    {Math.round(portion.accuracy * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <Button variant="default" className="w-full" onClick={() => navigate(-1)}>
            <Check size={18} />
            {t('comparison.finish', 'Terminer')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => navigate('/review/queue')}
          >
            {t('comparison.reviewQueue', 'Voir la file de revision')}
          </Button>
        </div>
      </div>
    </FullScreenPage>
  );
}
