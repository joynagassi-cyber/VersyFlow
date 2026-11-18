import { useAppearanceStore } from '@/store/appearance-store';
import { getAppIconUrl } from '@/theme/app-icons';

interface AppIconProps {
  size?: number;
  className?: string;
  rounded?: boolean;
  alt?: string;
  /** Override the persisted store selection (e.g. inside the icon picker grid). */
  iconId?: string;
}

/** App icon (full-bleed 1024×1024 asset clipped to an OS-style 22% squircle). */
export function AppIcon({
  size = 48,
  className,
  rounded = true,
  alt = 'VersyFlow',
  iconId,
}: AppIconProps) {
  const activeIconId = useAppearanceStore((s) => s.appIconId);
  const src = getAppIconUrl(iconId ?? activeIconId);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: rounded ? '22%' : 0,
      }}
    />
  );
}

export default AppIcon;
