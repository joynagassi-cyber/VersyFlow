import { useEffect, useState, type CSSProperties } from 'react';
import { useAppearanceStore, type GlassSettings } from '@/store/appearance-store';
import { useTranslation } from 'react-i18next';

const labels = { net: 'Net', equilibre: 'Équilibré', doux: 'Doux', opaque: 'Opaque' } as const;
const fields: { key: keyof GlassSettings; label: string; max: number; min: number; step: number; unit: string }[] = [
  { key: 'bgBlur', label: "Flou de l’image", min: 0, max: 24, step: 1, unit: 'px' },
  { key: 'glassBlur', label: 'Flou Glass', min: 0, max: 40, step: 1, unit: 'px' },
  { key: 'glassAlpha', label: 'Opacité Glass', min: 20, max: 85, step: 1, unit: '%' },
  { key: 'veilAlpha', label: 'Voile', min: 0, max: 100, step: 5, unit: '%' },
];

export function BackgroundControls({ showPreview = true }: { showPreview?: boolean }) {
  const { t } = useTranslation();
  const settings = useAppearanceStore((s) => s.glassSettings);
  const setSettings = useAppearanceStore((s) => s.setGlassSettings);
  const active = useAppearanceStore((s) => s.glassPreset);
  const applyPreset = useAppearanceStore((s) => s.applyGlassPreset);
  const reduced = useAppearanceStore((s) => s.reducedTransparency || s.highContrast);
  const [systemOpaque, setSystemOpaque] = useState(false);
  useEffect(() => {
    const queries = ['(prefers-reduced-transparency: reduce)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q));
    const update = () => setSystemOpaque(queries.some((q) => q.matches));
    update();
    queries.forEach((q) => q.addEventListener('change', update));
    return () => queries.forEach((q) => q.removeEventListener('change', update));
  }, []);
  return (
    <div className="background-controls">
      <div className="background-presets" role="group" aria-label={t('appearanceEditor.glassPresets', 'Préréglages Glass')}>
        {(Object.keys(labels) as (keyof typeof labels)[]).map((key) => (
          <button type="button" key={key} aria-pressed={active === key} onClick={() => applyPreset(key)}>{t(`appearanceEditor.glassPreset_${key}`, labels[key])}</button>
        ))}
        {active === 'custom' && <span className="background-custom">{t('appearanceEditor.glassCustom', 'Personnalisé')}</span>}
      </div>
      {(systemOpaque || reduced) && <p role="status">{t('appearanceEditor.glassAccessible', 'Rendu opaque activé par les préférences d’accessibilité. Vos réglages restent enregistrés.')}</p>}
      {fields.map(({ key, label, min, max, step, unit }) => (
        <label className="background-control" key={key}>
          <span className="background-control-heading"><span>{t(`appearanceEditor.glassField_${key}`, label)}</span><output>{settings[key]} {unit}</output></span>
          <input type="range" style={{ '--range-progress': `${((settings[key] - min) / (max - min)) * 100}%` } as CSSProperties} min={min} max={max} step={step} value={settings[key]} aria-valuetext={`${settings[key]} ${unit}`} onChange={(e) => setSettings({ [key]: Number(e.target.value) })} />
          {key === 'glassAlpha' && <span className="background-control-ends"><span>{t('appearanceEditor.transparent', 'Transparent')}</span><span>{t('appearanceEditor.opaque', 'Opaque')}</span></span>}
          {key === 'glassAlpha' && settings.glassAlpha < 30 && <span>{t('appearanceEditor.glassLowReadability', 'Lisibilité réduite')}</span>}
        </label>
      ))}
      {showPreview && <div className="background-preview" aria-label={t('appearanceEditor.glassPreview', 'Aperçu de la surface de lecture')}>
        <strong>{t('appearanceEditor.liveReading', 'Aperçu de lecture')}</strong><p>{t('appearanceEditor.glassPreviewText', 'Le texte reste au premier plan.')}</p><p>{t('appearanceEditor.glassPreviewBackground', 'Le fond se devine derrière la carte.')}</p>
      </div>}
      <button type="button" className="background-reset" onClick={() => applyPreset('equilibre')}>{t('appearanceEditor.resetGlass', 'Réinitialiser Glass')}</button>
    </div>
  );
}
