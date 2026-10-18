import React from 'react';

export function InterludeBanner(): React.ReactElement {
  return (
    <section
      aria-hidden="true"
      className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 select-none pointer-events-none"
    >
      <div className="relative overflow-hidden rounded-xl border border-paper-border bg-paper-surface shadow-paper-md">
        <picture>
          <source srcSet="/images/interlude/interlude-mixer.avif" type="image/avif" />
          <source srcSet="/images/interlude/interlude-mixer.webp" type="image/webp" />
          <img
            src="/images/interlude/interlude-mixer.jpg"
            alt=""
            width={1344}
            height={576}
            loading="lazy"
            decoding="async"
            className="w-full h-auto aspect-[21/9] object-cover grayscale contrast-115 dark:brightness-80 transition-all duration-[600ms] motion-reduce:transition-none"
          />
        </picture>
        {/* Voile Encre & Papier pour intégration harmonieuse */}
        <div className="absolute inset-0 bg-paper-accent/5 pointer-events-none" />
      </div>
    </section>
  );
}
