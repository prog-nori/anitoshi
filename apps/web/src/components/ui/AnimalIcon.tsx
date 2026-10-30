import { useState } from 'react';
export function AnimalIcon({ src, className = '' }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      className={className}
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={`icon-fallback ${className}`} aria-hidden="true">
      ◇
    </span>
  );
}
