import { BrandLogo } from './BrandLogo';

export function LoadingScreen({ label = 'Preparando tu día…' }: { label?: string }) {
  return (
    <div className="loading-screen" role="status">
      <BrandLogo size={58} showText={false} />
      <div className="loading-line"><span /></div>
      <p>{label}</p>
    </div>
  );
}
