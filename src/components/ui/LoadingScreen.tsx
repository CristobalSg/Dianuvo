export function LoadingScreen({ label = 'Preparando tu día…' }: { label?: string }) {
  return (
    <div className="loading-screen" role="status">
      <div className="brand-mark">D</div>
      <div className="loading-line"><span /></div>
      <p>{label}</p>
    </div>
  );
}
