import iconUrl from '@/assets/icons/versyflow_icon.png?url';

interface AppIconProps {
  size?: number;
  className?: string;
  rounded?: boolean;
  alt?: string;
}

/** App icon (rounded-square, white background, magenta wings). */
export function AppIcon({
  size = 48,
  className,
  rounded = true,
  alt = 'VersyFlow',
}: AppIconProps) {
  return (
    <img
      src={iconUrl}
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
