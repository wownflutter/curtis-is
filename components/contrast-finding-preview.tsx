'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Contrast Security's real project imagery transitions from the existing
 * finding-oriented cover to the issue remediation interface.
 *
 * Autoplays when visible (including on initial page load if above the fold)
 * and pauses offscreen. The remediation screenshot must load before motion
 * starts, and the static cover remains available for reduced-motion users.
 */
export function ContrastFindingPreview() {
  const previewRef = useRef<HTMLDivElement>(null);
  const remediationRef = useRef<HTMLImageElement>(null);
  const [visible, setVisible] = useState(false);
  const [remediationReady, setRemediationReady] = useState(false);

  useEffect(() => {
    if (remediationRef.current?.complete && remediationRef.current.naturalWidth > 0) {
      setRemediationReady(true);
    }

    const preview = previewRef.current;
    if (!preview) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.35),
      { threshold: [0, 0.35, 0.55] },
    );
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={previewRef}
      className={`contrast-finding-preview${visible && remediationReady ? ' is-playing' : ''}`}
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
        ref={remediationRef}
        className="contrast-preview-remediation"
        src="/case-studies/cont-issue-remediation.png"
        alt=""
        width={1920}
        height={1834}
        loading="lazy"
        decoding="async"
        aria-hidden="true"
        onLoad={() => setRemediationReady(true)}
      />
      <div className="contrast-preview-sequence" aria-hidden="true">
        <span className="contrast-preview-step contrast-preview-step-first">Finding</span>
        <span className="contrast-preview-direction">→</span>
        <span className="contrast-preview-step contrast-preview-step-second">Remediation</span>
      </div>
    </div>
  );
}
