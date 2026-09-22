import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/brand/AppIcon';
import { cn } from '@/lib/utils';

interface Props {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(onFinish, 1600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-surface-tint via-background to-background" />
      <div
        className={cn(
          'relative flex flex-col items-center transition-all duration-700',
          visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0',
        )}
      >
        <div className="glow-primary rounded-[28%] bg-surface p-1">
          <AppIcon size={104} rounded />
        </div>
        <h1 className="text-gradient-hero mt-5 text-3xl font-extrabold tracking-tight">VersyFlow</h1>
        <p className="mt-2 px-8 text-center text-sm text-text-tertiary">
          {t('onboarding.tagline', "Mémorisation biblique intuitive")}
        </p>
      </div>
    </div>
  );
}
