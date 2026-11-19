/**
 * Dev panel — `/dev`
 *
 * The control room for frontend-only testing:
 *   - shows which backend is active (mock vs live) and switches it,
 *   - reseeds / resets / exports the in-browser test database,
 *   - reports the local test API (health, queued events) and pushes a
 *     snapshot on demand,
 *   - lists the most recent events received by the collector.
 *
 * It is reachable without onboarding so a fresh browser can jump straight
 * into a seeded session.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Icon } from '@solar-icons/react/lib/types';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  ArrowRight01Icon as ArrowRight,
  RefreshIcon as Refresh,
  Database01Icon as Database,
  CloudUploadIcon as Upload,
  Download01Icon as Download,
  Delete02Icon as Trash,
  CheckmarkCircle02Icon as Check,
  AlertCircleIcon as Alert,
  ExternalLinkIcon as ExternalLink,
  Settings01Icon as Settings,
} from '@/components/ui/solar-icons';
import { FullScreenPage } from '@/components/layout/FullScreenPage';
import { Button } from '@/components/ui/button';
import {
  MOCK_COLLECTIONS,
  mockDb,
  type MockCollectionName,
} from '@/dev/mock/db';
import {
  seedMockDatabase,
  SEED_VERSES,
} from '@/dev/mock/seed';
import { getMockIdentity } from '@/dev/mock/identity';
import {
  describeDataMode,
  getDataMode,
  reloadWithDataMode,
} from '@/dev/mode';
import {
  localBackend,
  recordTestEvent,
  type LocalBackendStats,
  type TestEvent,
} from '@/dev/local-backend';
import { getMockBootInfo } from '@/dev/bootstrap';
import { DemoModePanel } from '@/components/dev/DemoModePanel';
import { resetDemoSession } from '@/dev/demo-session';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';

const COLLECTION_LABELS: Record<MockCollectionName, string> = {
  users: 'Comptes',
  learner_profiles: 'Profils',
  memorization_records: 'Versets mémorisés',
  review_logs: 'Révisions',
  streaks: 'Séries (streaks)',
  families: 'Familles',
  family_memberships: 'Membres',
  family_invitations: 'Invitations',
  translation_preferences: 'Préférence traduction',
  telemetry_events: 'Télémétrie',
  test_events: 'Événements de test',
};

function Card({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon: Icon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl bg-surface p-4 shadow-sm', className)}>
      <p className="mb-3 flex items-center gap-2 section-label">
        <DuoIcon icon={icon} size={14} className="text-primary" />
        {title}
      </p>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-tint px-3 py-2">
      <p className="text-2xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-lg font-extrabold text-text-primary">{value}</p>
    </div>
  );
}

export default function DevPanelScreen() {
  const navigate = useNavigate();
  const mode = getDataMode();
  const boot = getMockBootInfo();
  const identity = useMemo(() => getMockIdentity(), []);

  const [stats, setStats] = useState<LocalBackendStats>(() => localBackend.getStats());
  const [counts, setCounts] = useState(() => mockDb.counts());
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const offBackend = localBackend.subscribe(setStats);
    const offDb = mockDb.subscribe(() => setCounts(mockDb.counts()));
    void localBackend.checkHealth();
    return () => {
      offBackend();
      offDb();
    };
  }, []);

  const refreshEvents = useCallback(async () => {
    const list = await localBackend.recentEvents(12);
    setEvents(list);
  }, []);

  useEffect(() => {
    void refreshEvents();
  }, [refreshEvents, stats.sent, stats.health]);

  const withBusy = useCallback(
    async (label: string, action: () => Promise<void> | void) => {
      setBusy(label);
      setNotice(null);
      try {
        await action();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'Action échouée');
      } finally {
        setBusy(null);
      }
    },
    [],
  );

  const handleSeed = () =>
    withBusy('seed', () => {
      const result = seedMockDatabase({ force: true });
      recordTestEvent('dev.seed', { seeded: result.seeded, records: result.records });
      setNotice(`Base réinitialisée avec ${result.records} versets de démonstration.`);
    });

  const handleReset = () =>
    withBusy('reset', () => {
      // Efface TOUT l'espace de démo (base mock + préférences isolées :
      // apparence, profil, famille, historique de recherche…), puis re-sème.
      // Les clés réelles ne sont jamais touchées.
      const { clearedKeys, seeded } = resetDemoSession();
      recordTestEvent('dev.reset', { clearedKeys, seeded });
      setNotice(
        `Démo réinitialisée : ${clearedKeys} ${clearedKeys > 1 ? 'clés' : 'clé'} de démo ${
          clearedKeys > 1 ? 'effacées' : 'effacée'
        }, base re-seedée. Rechargement…`,
      );
      window.setTimeout(() => window.location.reload(), 350);
    });

  const handleSkipOnboarding = () =>
    withBusy('skip', () => {
      useSettingsStore.getState().completeOnboarding();
      recordTestEvent('dev.skip-onboarding', {});
      setNotice('Onboarding marqué comme terminé — ouverture de l’accueil.');
      navigate('/tabs/home', { replace: true });
    });

  const handleFlush = () =>
    withBusy('flush', async () => {
      const { sent } = await localBackend.flush();
      setNotice(sent > 0 ? `${sent} événement(s) envoyé(s) à l'API locale.` : 'Aucun événement en file.');
    });

  const handleSnapshot = () =>
    withBusy('snapshot', async () => {
      const ok = await localBackend.pushSnapshot(mockDb.snapshot());
      setNotice(ok ? 'Instantané envoyé au serveur local.' : "Serveur local injoignable — lancez `npm run mock:server`.");
    });

  const handleExport = () =>
    withBusy('export', () => {
      const payload = {
        exportedAt: new Date().toISOString(),
        mode,
        identity,
        boot,
        database: mockDb.snapshot(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `versyflow-test-data-${new Date().toISOString().slice(0, 19)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('Export JSON téléchargé.');
    });

  const healthDot =
    stats.health === 'online'
      ? 'bg-green-500'
      : stats.health === 'offline'
        ? 'bg-error'
        : 'bg-amber-400';

  return (
    <FullScreenPage
      title="Panneau de test"
      subtitle={describeDataMode()}
      showBack
      backPath="/tabs/settings"
      column="narrow"
      right={
        <Button variant="ghost" size="sm" onClick={() => navigate('/tabs/home')}>
          App
          <DuoIcon icon={ArrowRight} size={16} />
        </Button>
      }
    >
      <div className="space-y-4 pb-10">
        {/* ---------------- Démo / réel ---------------- */}
        <DemoModePanel compact />

        {/* ---------------- Laboratoire duotone ---------------- */}
        {/* Le panneau dev est le seul endroit qu'on ouvre « pour régler un
            détail d'affichage » : c'est donc là que doit se trouver l'entrée
            vers le laboratoire, plutôt qu'une URL à retenir par cœur. */}
        {import.meta.env.DEV && (
          <Link
            to="/__dev/duotone"
            className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 shadow-sm"
          >
            <span>
              <span className="block text-sm font-bold text-text-primary">Boutons duotone</span>
              <span className="block text-xs text-text-muted">
                Cinq règles de couleur côte à côte : repos, survol, actif.
              </span>
            </span>
            <DuoIcon icon={ArrowRight} size={18} />
          </Link>
        )}

        {/* ---------------- Mode ---------------- */}
        <Card title="Mode de données" icon={Database}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-extrabold text-text-primary">
                {mode === 'mock' ? 'MOCK (frontend seul)' : 'LIVE (Supabase + PowerSync)'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {mode === 'mock'
                  ? 'Aucune requête réseau vers Supabase. Données locales + API de test.'
                  : 'Synchronisation cloud active.'}
              </p>
            </div>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-bold',
                mode === 'mock'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-green-500/10 text-green-600',
              )}
            >
              {mode.toUpperCase()}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={mode === 'mock' ? 'secondary' : 'default'}
              disabled={mode === 'mock'}
              onClick={() => reloadWithDataMode('mock')}
            >
              Utiliser le mock
            </Button>
            <Button
              size="sm"
              variant={mode === 'live' ? 'secondary' : 'outline'}
              disabled={mode === 'live'}
              onClick={() => reloadWithDataMode('live')}
            >
              Utiliser le backend réel
            </Button>
          </div>
          <p className="mt-3 text-2xs text-text-muted">
            Le changement recharge l'application. Vous pouvez aussi forcer le mode via
            l'URL : <code className="rounded bg-surface-tint px-1">?data=mock</code> ou{' '}
            <code className="rounded bg-surface-tint px-1">?data=live</code>.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="outline"
            onClick={() => void handleSkipOnboarding()}
            disabled={busy !== null}
          >
            <DuoIcon icon={ArrowRight} size={15} />
            Sauter l'onboarding et ouvrir l'app
          </Button>
        </Card>

        {/* ---------------- Identity ---------------- */}
        <Card title="Identité de test" icon={Settings}>
          <div className="space-y-1 text-sm text-text-secondary">
            <p>
              <span className="text-text-muted">Nom :</span> {identity.displayName}
            </p>
            <p>
              <span className="text-text-muted">E-mail :</span> {identity.email}
            </p>
            <p className="break-all">
              <span className="text-text-muted">ID :</span> {identity.id}
            </p>
            {boot && (
              <p className="text-xs text-text-muted">
                Seed au démarrage : {boot.seeded ? 'créé' : 'déjà présent'} ·{' '}
                {boot.records} versets · {boot.reviewLogs} révisions
              </p>
            )}
          </div>
        </Card>

        {/* ---------------- Local API ---------------- */}
        <Card title="API de test locale" icon={Upload}>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="File" value={stats.queued} />
            <Stat label="Envoyés" value={stats.sent} />
            <Stat label="Échecs" value={stats.failed} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('h-2.5 w-2.5 rounded-full', healthDot)} />
            <span className="font-semibold text-text-primary">
              {stats.health === 'online'
                ? 'Connectée'
                : stats.health === 'offline'
                  ? 'Injoignable'
                  : 'Inconnue'}
            </span>
            <span className="truncate text-xs text-text-muted">{stats.baseUrl}</span>
          </div>
          {stats.lastError && (
            <p className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
              {stats.lastError} — lancez{' '}
              <code className="font-bold">npm run mock:server</code> (ou{' '}
              <code className="font-bold">npm run dev:mock</code>).
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void handleFlush()} disabled={busy !== null}>
              <DuoIcon icon={Refresh} size={15} />
              Vider la file
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleSnapshot()} disabled={busy !== null}>
              <DuoIcon icon={Upload} size={15} />
              Envoyer l'instantané
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={localBackend.dashboardUrl()} target="_blank" rel="noreferrer">
                <DuoIcon icon={ExternalLink} size={15} />
                Tableau de bord
              </a>
            </Button>
          </div>
        </Card>

        {/* ---------------- Local data ---------------- */}
        <Card title="Données locales" icon={Database}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MOCK_COLLECTIONS.filter((name) => name !== 'test_events').map((name) => (
              <div
                key={name}
                className="rounded-xl bg-surface-tint px-3 py-2"
              >
                <p className="text-2xs uppercase tracking-wide text-text-muted">
                  {COLLECTION_LABELS[name]}
                </p>
                <p className="text-base font-extrabold text-text-primary">
                  {counts[name]}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void handleSeed()} disabled={busy !== null}>
              <DuoIcon icon={Refresh} size={15} />
              Re-seeder
            </Button>
            <Button size="sm" variant="outline" onClick={() => void handleExport()} disabled={busy !== null}>
              <DuoIcon icon={Download} size={15} />
              Exporter en JSON
            </Button>
            <Button size="sm" variant="destructive" onClick={() => void handleReset()} disabled={busy !== null}>
              <DuoIcon icon={Trash} size={15} />
              Tout réinitialiser
            </Button>
          </div>
          <p className="mt-3 text-2xs text-text-muted">
            {SEED_VERSES.length} versets de démonstration (LSG) sont disponibles dans
            le seed, dont {SEED_VERSES.filter((v) => v.dueInDays <= 0).length} à
            réviser aujourd'hui.
          </p>
        </Card>

        {/* ---------------- Recent events ---------------- */}
        <Card title="Derniers événements reçus par le serveur" icon={Check}>
          {notice && (
            <p className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              {notice}
            </p>
          )}
          {events.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-text-muted">
              <DuoIcon icon={Alert} size={16} />
              Aucun événement reçu. Démarrez l'API locale, puis naviguez dans l'app.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-divider)]">
              {events.map((event) => (
                <li key={event.id} className="py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-text-primary">{event.type}</span>
                    <span className="text-text-muted">
                      {new Date(event.at).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-tint p-2 text-3xs text-text-secondary">
                    {JSON.stringify(event.payload ?? {}, null, 2)}
                  </pre>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </FullScreenPage>
  );
}
