import { useState } from 'react';
import { Switch } from '@/components/ui/Switch';
import { useTranslation } from 'react-i18next';
import { normalizeLocaleCode } from '@/domains/i18n/config';
import { applyWeeklyPlan, loadWeeklyPlan, type ReminderDay, type WeeklyReminderKind } from '@/services/weekly-reminder-plan';

const DAYS: ReminderDay[] = [2, 3, 4, 5, 6, 7, 1];
export function WeeklyReminderPlanner() {
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState(loadWeeklyPlan);
  const [status, setStatus] = useState<'idle' | 'working' | 'native' | 'web' | 'error'>('idle');
  const update = (kind: WeeklyReminderKind, patch: Partial<typeof plan.review>) => {
    setPlan((current) => ({ ...current, [kind]: { ...current[kind], ...patch } }));
    setStatus('idle');
  };
  const save = async () => {
    setStatus('working');
    try {
      const result = await applyWeeklyPlan(plan, {
        review: t('weeklyReminders.reviewBody', 'Prenez un moment pour réviser les versets que vous apprenez.'),
        memorization: t('weeklyReminders.memorizationBody', 'Prenez un moment pour mémoriser un passage biblique.'),
      });
      setStatus(result);
    } catch {
      setStatus('error');
    }
  };
  const locale = normalizeLocaleCode(i18n.resolvedLanguage || i18n.language);
  return <section className="g2 weekly-planner">
    <h2>{t('weeklyReminders.title', 'Planning hebdomadaire')}</h2>
    <p className="weekly-planner-hint">{t('weeklyReminders.intro', 'Choisissez séparément les jours et l’heure de vos révisions et de votre mémorisation.')}</p>
    {(['review', 'memorization'] as const).map((kind) => <div key={kind} className="weekly-planner-group">
      <div className="weekly-planner-heading">
        <h3>{kind === 'review' ? t('weeklyReminders.review', 'Récupération active') : t('weeklyReminders.memorization', 'Mémorisation biblique')}</h3>
        <Switch
          checked={plan[kind].enabled}
          onCheckedChange={(next) => update(kind, { enabled: next })}
          label={kind === 'review' ? t('weeklyReminders.review', 'Récupération active') : t('weeklyReminders.memorization', 'Mémorisation biblique')}
        />
      </div>
      <div className="weekly-days" role="group" aria-label={t('weeklyReminders.days', 'Jours')}>
        {DAYS.map((day) => {
          // 7 January 2024 was Sunday, so day numbers match Capacitor's enum.
          const date = new Date(2024, 0, 7 + day - 1);
          return <button key={day} type="button" disabled={!plan[kind].enabled} aria-label={date.toLocaleDateString(locale, { weekday: 'long' })} aria-pressed={plan[kind].days.includes(day)} onClick={() => update(kind, { days: plan[kind].days.includes(day) ? plan[kind].days.filter((d) => d !== day) : [...plan[kind].days, day] })}>{date.toLocaleDateString(locale, { weekday: 'short' })}</button>;
        })}
      </div>
      <label className="weekly-time">{t('weeklyReminders.time', 'Heure')} <input type="time" disabled={!plan[kind].enabled} value={plan[kind].time} onChange={(event) => { if (event.target.value) update(kind, { time: event.target.value }); }} /></label>
    </div>)}
    <button type="button" className="weekly-save" disabled={status === 'working'} onClick={() => void save()}>{t('weeklyReminders.save', 'Enregistrer le planning')}</button>
    {status !== 'idle' && <p className="weekly-planner-hint" role="status">{status === 'native' ? t('weeklyReminders.native', 'Planning enregistré et transmis à l’appareil.') : status === 'web' ? t('weeklyReminders.web', 'Planning enregistré. Sur le navigateur, les notifications en arrière-plan ne sont pas programmées.') : status === 'error' ? t('weeklyReminders.error', 'Impossible de programmer les rappels. Vérifiez les autorisations et réessayez.') : t('weeklyReminders.working', 'Enregistrement…')}</p>}
  </section>;
}
