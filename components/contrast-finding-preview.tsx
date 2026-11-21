'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A restrained two-state preview of the existing Contrast work.
 * The original project card remains the default image; the actual
 * remediation design appears briefly on entry and on hover/focus.
 */
export function ContrastFindingPreview() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.55)) return;
        observer.disconnect();
        showTimer = window.setTimeout(() => setPeeking(true), 450);
        hideTimer = window.setTimeout(() => setPeeking(false), 2400);
      },
      { threshold: [0, 0.55] },
    );
    observer.observe(preview);

    return () => {
      observer.disconnect();
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      ref={previewRef}
      className={`contrast-finding-preview${peeking ? ' is-peeking' : ''}`}
    >
      <img
        className="contrast-preview-finding"
        src="/portfolio/cards-cont@2x.png"
        alt="Contrast Security NorthStar interface preview"
        width={1440}
        height={1080}
        decoding="async"
      />
      <img
        className="contrast-preview-remediation"
        src="/case-studies/cont-issue-remediation.png"
        alt=""
        width={1920}
        height={1834}
        loading="lazy"
        decoding="async"
        aria-hidden="true"
      />
      <div className="contrast-preview-sequence" aria-hidden="true">
        <span className="contrast-preview-step contrast-preview-step-first">Finding</span>
        <span className="contrast-preview-direction">→</span>
        <span className="contrast-preview-step contrast-preview-step-second">Remediation</span>
      </div>
    </div>
  );
}
