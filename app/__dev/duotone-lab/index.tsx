/**
 * Laboratoire — **boutons duotone** — `/__dev/duotone`
 *
 * Comparaison à l'écran, pas en prose : le même bouton, dans le même thème,
 * avec les mêmes icônes Solar, sous cinq règles de couleur différentes.
 *
 * Pourquoi ce labo existe
 * -----------------------
 * Aujourd'hui `DuoIcon` ne passe jamais `secondaryColor` à la bibliothèque.
 * Or les icônes Solar « duotone » sont faites de deux calques : le premier
 * suit `currentColor`, le second lit `--solar-secondary-color` (par défaut
 * `currentColor`) avec `--solar-secondary-opacity: .5`. Faute de seconde
 * couleur, les deux calques sont la même teinte → ce qu'on voit n'est pas un
 * duotone mais un monochrome dégradé. C'est ce que décrit le ressenti :
 * « on voit juste des duotone en monochrome ».
 *
 * Et la couleur qui « prend le contrôle » au survol vient d'une seconde règle
 * dans `globals.css` (l. 1314-1316) qui écrase la première (l. 1162) :
 * `--mut` au repos, `--acc` au survol.
 *
 * Ce ne sont donc pas les icônes qu'il faut changer, ni les 549 appels :
 * uniquement la règle d'affichage.
 *
 * Développement uniquement : le module n'est jamais importé en production.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DuoIcon } from '@/components/ui/DuoIcon';
import {
  Home01Icon,
  BookOpen01Icon,
  ChartBarLineIcon,
  Settings01Icon,
} from '@/components/ui/solar-icons';
import '@/styles/duotone-lab.css';

type StateKey = 'rest' | 'hover' | 'active';

const STATES: ReadonlyArray<{ key: StateKey; label: string; cls: string }> = [
  { key: 'rest', label: 'Repos', cls: '' },
  { key: 'hover', label: 'Survol', cls: 'is-hover' },
  { key: 'active', label: 'Actif', cls: 'is-active' },
];

interface Variant {
  id: string;
  tag: string;
  title: string;
  note: string;
  reco?: boolean;
}

const VARIANTS: readonly Variant[] = [
  {
    id: 'dl-v0',
    tag: '0',
    title: 'Aujourd’hui — gris, puis l’accent reprend la main',
    note: 'Les deux calques partagent la teinte : le second, à 50 % d’opacité, ne creuse pas de profondeur, il salit le trait. Au survol, la teinte bascule d’un coup. Rien entre les deux.',
  },
  {
    id: 'dl-vA',
    tag: 'A',
    title: 'Vrai duotone — l’encre porte la structure, l’accent porte la masse',
    note: 'La seconde couche est colorée dès le repos (24 %), donc l’icône a une teinte sans crier. Le survol ne change plus la teinte, seulement la densité du voile : plus de bascule. L’actif durcit l’encre et le voile.',
    reco: true,
  },
  {
    id: 'dl-vB',
    tag: 'B',
    title: 'Pastille — l’icône reste une encre franche',
    note: 'Aucune teinte ne bouge, jamais. La couleur vit dans le contenant : 7 % au survol, 13 % + filet à l’actif. C’est la règle la plus sobre, et celle qui vieillit le mieux quand le thème change.',
  },
  {
    id: 'dl-vC',
    tag: 'C',
    title: 'Remplissage — le duotone récompense l’activation',
    note: 'Creux et neutre au repos (10 %), plein et coloré à l’actif (48 %). L’état se lit par la densité, pas seulement par la teinte : il reste lisible en niveaux de gris et pour un daltonien.',
  },
  {
    id: 'dl-vD',
    tag: 'D',
    title: 'Deux accents dès le repos',
    note: 'L’icône est colorée en permanence (--acc pour l’encre, --acc2 pour la masse). Le plus vivant, le plus proche de TickTick — et le plus risqué : sur un preset très saturé, deux teintes voisines se disputent.',
  },
];

function RailButton({
  state,
  label = 'Accueil',
  icon = Home01Icon,
}: {
  state: StateKey;
  label?: string;
  icon?: typeof Home01Icon;
}) {
  const cls = STATES.find((s) => s.key === state)?.cls ?? '';
  return (
    <button type="button" className={`dl-btn ${cls}`} tabIndex={-1}>
      <DuoIcon icon={icon} size={20} strokeWidth={1.75} />
      <span className="dl-label">{label}</span>
    </button>
  );
}

function TabButton({ state, label = 'Accueil' }: { state: StateKey; label?: string }) {
  const cls = STATES.find((s) => s.key === state)?.cls ?? '';
  return (
    <button type="button" className={`dl-tab ${cls}`} tabIndex={-1}>
      <span className="dl-pill">
        <DuoIcon icon={Home01Icon} size={23} strokeWidth={1.75} />
      </span>
      <span className="dl-dot" aria-hidden="true" />
      <span className="dl-tab-label">{label}</span>
    </button>
  );
}

export function DuotoneLab() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [situation, setSituation] = useState('dl-vA');
  const current = useMemo(() => VARIANTS.find((v) => v.id === situation) ?? VARIANTS[1], [situation]);

  return (
    <div className="dl-page">
      <div className="dl-head">
        <h1>Boutons duotone — cinq règles, une décision</h1>
        <p>
          Le problème n’est pas le jeu d’icônes. Les icônes Solar « duotone » ont deux calques ;
          <code>DuoIcon</code> ne passe jamais de seconde couleur, donc les deux calques ont la même
          teinte et l’on voit un monochrome dégradé. Et dans <code>globals.css</code>, une seconde
          règle (l.&nbsp;1314) écrase la première (l.&nbsp;1162) : gris au repos, accent au survol.
          Tout se joue donc sur une poignée de lignes de CSS — aucune des 549 utilisations n’est à
          toucher.
        </p>
      </div>

      <div className="dl-toolbar">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>
          Clair
        </button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>
          Sombre
        </button>
        <span className="dl-spacer" />
        <span className="dl-hint">Les états sont figés pour comparer ; le survol réel est en bas.</span>
      </div>

      <div className="dl-theme appearance-preview dl-lab" data-theme={theme}>
        {VARIANTS.map((v) => (
          <section key={v.id} className={`dl-variant ${v.id}`} data-reco={v.reco ? 'true' : 'false'}>
            <div className="dl-variant-head">
              <span className="dl-tag">{v.tag}</span>
              <span className="dl-title">{v.title}</span>
            </div>
            <p className="dl-note">{v.note}</p>
            <div className="dl-states">
              {STATES.map((s) => (
                <div key={s.key} className="dl-cell">
                  <span className="dl-cell-label">{s.label}</span>
                  <RailButton state={s.key} />
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <TabButton state={s.key} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="dl-situation dl-live">
          <h2>En situation — taille réelle</h2>
          <p>
            Variante affichée : <strong>{current.tag} — {current.title}</strong>. Survolez, cliquez :
            c’est le comportement réel, pas une image.
          </p>
          <div className="dl-toolbar" style={{ position: 'static', borderBottom: 0, margin: '0 0 12px' }}>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={situation === v.id}
                onClick={() => setSituation(v.id)}
              >
                {v.tag}
              </button>
            ))}
          </div>

          <div className={situation}>
            <div className="dl-rail">
              <RailButton state="active" label="Accueil" icon={Home01Icon} />
              <RailButton state="rest" label="Explorer" icon={BookOpen01Icon} />
              <RailButton state="rest" label="Progrès" icon={ChartBarLineIcon} />
              <RailButton state="rest" label="Réglages" icon={Settings01Icon} />
            </div>
            <div className="dl-tabbar">
              <TabButton state="active" label="Accueil" />
              <TabButton state="rest" label="Explorer" />
              <TabButton state="rest" label="Progrès" />
              <TabButton state="rest" label="Réglages" />
            </div>
          </div>
        </section>

        <p className="dl-foot">
          <strong>Ma recommandation :</strong> A pour le duotone lui-même (la seconde couche colorée
          dès le repos), la pastille de B pour les contenants (la couleur ne quitte pas sa place au
          survol), et le remplissage de C réservé à l’onglet actif du mobile, où la teinte seule est
          un signal trop faible sur une barre de quatre icônes.
          <br />
          <Link to="/dev">← Retour au panneau dev</Link>
        </p>
      </div>
    </div>
  );
}

export default DuotoneLab;
