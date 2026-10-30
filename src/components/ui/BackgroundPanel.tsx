import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAppearanceStore } from '@/store/appearance-store';
import { DuoIcon } from '@/components/ui/DuoIcon';
import { Settings01Icon, Cancel01Icon } from '@/components/ui/solar-icons';
import { BackgroundControls } from '@/components/ui/BackgroundControls';

export function BackgroundPanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = useAppearanceStore((s) => s.backgroundType === 'image' && !!s.colorThemeId);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!active) return null;
  return <>
    <button type="button" className="appearance-trigger" aria-expanded={open} aria-controls="background-panel" onClick={() => setOpen(!open)}>
      <DuoIcon icon={Settings01Icon} size={20} />
      <span>{t('appearanceEditor.trigger', 'Apparence')}</span>
    </button>
    {open && createPortal(<aside id="background-panel" className="background-panel g3" aria-label={t('appearanceEditor.panelLabel', 'Réglages d’arrière-plan')}>
      <div className="background-panel-heading"><h2>{t('appearanceEditor.panelTitle', 'Arrière-plan')}</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label={t('appearanceEditor.close', 'Fermer')}><DuoIcon icon={Cancel01Icon} size={20} /></button></div>
      <BackgroundControls />
    </aside>, document.body)}
  </>;
}
