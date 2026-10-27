import logoUrl from '@/assets/icons/versyflow_logo.png?url';

interface LogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/** Brand mark (transparent background, magenta wings + red outline). */
export function Logo({ size = 48, className, alt = 'VersyFlow' }: LogoProps) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

export default Logo;
