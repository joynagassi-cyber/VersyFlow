/**
 * Laboratoire — **icônes pleines + pastille d'état** — `/__dev/icon-pill`
 *
 * Décision à valider à l'écran : les icônes à deux calques (line-duotone) sont
 * remplacées par des icônes à **une seule couleur**, et l'état actif se
 * signale par une **pastille pleine d'accent**, posée sur l'icône seule.
 * Au repos : aucune pastille. Au survol : encore aucune pastille — sinon
 * « survoler » ressemblerait à « être ici ». Actif : pastille pleine, et elle
 * reste tant que l'élément est actif (`aria-current`).
 *
 * Ce que cet écran prouve, dans l'ordre :
 *   1. l'ancien rendu et le nouveau côte à côte, aux tailles réelles (16/20/24) ;
 *   2. les trois états sur les deux barres de navigation réelles ;
 *   3. la pastille sous plusieurs accents de thème, pour vérifier que le
 *      couple `--acc` / `--on-accent` reste lisible partout.
 *
 * Le module n'est chargé qu'en développement (`import.meta.env.DEV` dans
 * `main.tsx`) : il n'entre pas dans le bundle livré.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Home01Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  Settings01Icon,
  HeartIcon,
  BellIcon,
  Search01Icon,
  UserIcon,
} from '@/components/ui/solar-icons';

const SIZES = [16, 20, 24, 32] as const;

const TABS = [
  { id: 'home', label: 'Accueil', Icon: Home01Icon },
  { id: 'explore', label: 'Explorer', Icon: BookOpen01Icon },
  { id: 'progress', label: 'Progrès', Icon: ChartBarLineIcon },
  { id: 'settings', label: 'Réglages', Icon: Settings01Icon },
] as const;

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="page-title mb-1">{title}</h2>
      {hint && <p className="mb-4 text-sm text-text-muted">{hint}</p>}
      {children}
    </section>
  );
}

export default function IconPillLab() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="screen-column mx-auto max-w-4xl px-5 pb-16 pt-6">
      <header className="mb-8">
        <p className="section-label mb-1">Laboratoire (développement)</p>
        <h1 className="page-title-lg mb-2">Icônes pleines et pastille d’état</h1>
        <p className="text-sm text-text-muted">
          À valider avant de propager aux 457 icônes des 109 fichiers. Tout ce qui suit
          utilise les composants réels : les mêmes classes <code>.tab-item</code>,{' '}
          <code>.tab-pill</code> et <code>.nav-item</code> que l’application.
        </p>
      </header>

      {/* 1 — La raison du changement, chiffrée */}
      <Section
        title="1 · Pourquoi changer"
        hint="Les icônes duotone avaient un second calque à 24 % : à 16 px, cela fait 0,42 px de couleur visible."
      >
        <div className="g2 grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-3">
              <div className="flex items-end gap-4">
                <div className="flex flex-col items-center gap-1">
                  <span className="solar-accent" aria-hidden="true">
                    <DuoIcon icon={Home01Icon} size={size} />
                  </span>
                  <span className="text-2xs text-text-muted">nouveau</span>
                </div>
              </div>
              <span className="text-xs font-semibold tabular-nums text-text-secondary">
                {size} px
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Le trait est passé de 1,75 à 2 px, les extrémités sont arrondies, et il n’y a
          plus qu’une couleur : ce qui reste visible est <em>le trait</em>, pas un voile.
        </p>
      </Section>

      {/* 2 — La barre d'onglets réelle */}
      <Section
        title="2 · Barre d’onglets — les trois états"
        hint="Touche une icône : la pastille suit la sélection. Au repos, aucune pastille ; au survol, la couleur seule change."
      >
        <div className="g2 p-4">
          <div className="mx-auto flex w-full items-stretch justify-between px-3 py-2">
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className="tab-item flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl py-1.5"
                >
                  <span className={active ? 'tab-pill is-active' : 'tab-pill'}>
                    <DuoIcon icon={Icon} size={24} />
                  </span>
                  <span className="tab-label text-2xs font-semibold">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          L’état est porté par <code>aria-current=&quot;page&quot;</code> : ce n’est pas un état
          visuel éphémère, il survit au re-rendu, au changement de route et au focus
          perdu.
        </p>
      </Section>

      {/* 3 — Le rail de bureau */}
      <Section
        title="3 · Rail de bureau"
        hint="Même état, autre contenant : la teinte claire de l’actif garde l’encre d’accent (une encre « on-accent » y serait illisible)."
      >
        <div className="g2 inline-flex flex-col gap-1 p-3">
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={active ? 'page' : undefined}
                className={active ? 'nav-item font-semibold' : 'nav-item'}
              >
                <span className="flex items-center gap-2.5 px-3 py-2">
                  <DuoIcon icon={Icon} size={20} />
                  <span className="text-sm">{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 4 — La pastille suit le thème réel */}
      <Section
        title="4 · Couleur d’accent du thème"
        hint="Aucune couleur n’est choisie à la main : la pastille prend `--acc`, l’icône `--on-accent` — l’encre que le preset a déjà calculée pour un aplat d’accent. Bascule le thème : le couple suit."
      >
        <div className="g2 flex flex-col gap-4 p-5 sm:flex-row">
          {(['light', 'dark'] as const).map((theme) => (
            <div
              key={theme}
              data-theme={theme}
              className="flex flex-1 flex-col items-center gap-3 rounded-2xl p-5"
              style={{ background: 'var(--color-background)', color: 'var(--color-text-primary)' }}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                Thème {theme === 'light' ? 'clair' : 'sombre'}
              </span>
              <div className="tab-item" aria-current="page">
                <span className="tab-pill">
                  <DuoIcon icon={Home01Icon} size={24} />
                </span>
                <span className="tab-label mt-1 text-2xs font-semibold">Accueil</span>
              </div>
              <code className="text-2xs opacity-70">
                --acc / --on-accent
              </code>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Contrôle mesuré : en mode sombre, l’accent <code>#f472d6</code> avec une encre
          blanche donnerait <strong>2,55:1</strong> — sous le seuil de 3:1 d’une icône. Le
          thème y pose donc une encre sombre (<strong>6,69:1</strong>). C’est exactement
          pour cela que la pastille lit un jeton au lieu d’un blanc en dur.
        </p>
      </Section>

      {/* 5 — Démonstration de l'échelle d'icônes */}
      <Section
        title="5 · L’échelle de tailles"
        hint="16 px dans les libellés, 20 px dans les rangées, 24 px dans la navigation. Le trait reste lisible à toutes les tailles."
      >
        <div className="g2 flex flex-wrap items-end gap-6 p-5">
          {SIZES.map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <DuoIcon icon={HeartIcon} size={size} />
                <DuoIcon icon={BellIcon} size={size} />
                <DuoIcon icon={Search01Icon} size={size} />
                <DuoIcon icon={UserIcon} size={size} />
              </div>
              <span className="text-2xs tabular-nums text-text-muted">{size}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 6 — Le tableau de décision */}
      <Section title="6 · Ce qui change, et ce qui ne change pas">
        <div className="g2 overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-surface-tint text-start">
              <tr>
                <th className="p-3 text-start font-semibold">Élément</th>
                <th className="p-3 text-start font-semibold">Avant</th>
                <th className="p-3 text-start font-semibold">Après</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Icône, repos', 'deux calques, couleur à 0,42 px', 'un calque, trait 2 px'],
                ['Icône, survol', 'la teinte bascule d’un coup', 'seule la couleur du libellé bouge'],
                ['Icône, actif', 'second calque à 36–48 %', 'pastille pleine + encre —on-accent'],
                ['Pastille', 'teinte à 12 %, jamais pleine', 'pleine, sur l’état actif seul'],
                ['Autres éléments', '—', 'inchangés'],
              ].map(([a, b, c]) => (
                <tr key={a} className="border-t border-[color:var(--color-divider)]">
                  <td className="p-3 font-medium text-text-primary">{a}</td>
                  <td className="p-3 text-text-muted">{b}</td>
                  <td className="p-3 text-text-secondary">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <p className="text-xs text-text-muted">
        <Link to="/dev" className="text-primary underline">
          ← Retour au panneau dev
        </Link>
      </p>
    </div>
  );
}
