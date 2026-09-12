/**
 * Settings — Reminder Configuration Screen
 *
 * Interactive page to configure review reminders: how many reminders per
 * day ("nombre de fois par jour"), reminder time, and on/off toggle.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Clock,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppearanceStore } from '@/store/appearance-store';

const FREQUENCIES = [1, 2, 3, 5, 8, 12];

export default function SettingsRemindersScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    reminderFrequency,
    reminderEnabled,
    reminderTime,
    setReminderFrequency,
    toggleReminders,
    setReminderTime,
  } = useAppearanceStore();

  return (
    <div className="flex min-h-full flex-col p-6">
      <header className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-sm"
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} className="text-text-secondary" />
        </button>
        <h1 className="text-2xl font-bold text-text-primary">
          {t('settings.reminderConfig', 'Rappels de révision')}
        </h1>
      </header>

      <div className="flex flex-1 flex-col gap-6">
        {/* On / off toggle */}
        <button
          onClick={toggleReminders}
          className={cn(
            'flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors',
            reminderEnabled
              ? 'border-primary bg-surface-tint'
              : 'border-transparent bg-surface shadow-sm',
          )}
        >
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              reminderEnabled ? 'bg-primary text-white' : 'bg-surface-tint text-primary',
            )}
          >
            {reminderEnabled ? <BellRing size={22} /> : <Bell size={22} />}
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderEnabled')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {reminderEnabled ? t('common.on') : t('common.off')}
            </p>
          </div>
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2',
              reminderEnabled ? 'border-primary bg-primary' : 'border-text-muted',
            )}
          >
            {reminderEnabled && <Check size={14} className="text-white" />}
          </div>
        </button>

        {/* Frequency */}
        <div className={cn(!reminderEnabled && 'opacity-40')}>
          <div className="mb-3 flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            <span className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderFrequency')}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {FREQUENCIES.map((f) => {
              const selected = reminderFrequency === f;
              return (
                <button
                  key={f}
                  disabled={!reminderEnabled}
                  onClick={() => setReminderFrequency(f)}
                  className={cn(
                    'flex h-14 min-w-14 items-center justify-center rounded-2xl border-2 px-4 text-lg font-semibold transition-colors disabled:opacity-40',
                    selected
                      ? 'border-primary bg-surface-tint text-primary'
                      : 'border-transparent bg-surface text-text-secondary shadow-sm',
                  )}
                >
                  {f}
                  {selected && <Check className="ml-1" size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reminder time */}
        <div className={cn('flex items-center gap-4', !reminderEnabled && 'opacity-40')}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-tint">
            <Clock size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-semibold text-text-primary">
              {t('onboarding.reminderTime')}
            </p>
            <input
              type="time"
              value={reminderTime}
              disabled={!reminderEnabled}
              onChange={(e) => setReminderTime(e.target.value)}
              className="mt-1 h-11 rounded-lg border border-border bg-surface px-3 text-base text-text-primary disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          {t('common.back')}
        </Button>
      </div>
    </div>
  );
}
