'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A finding → remediation preview using existing Contrast project images.
 * Automatically plays once when visible; never obscures the original cover
 * if the second image does not load.
 *
 * Emergency per-page static fallback: /?contrast-motion=off
 * A pre-deployment backup branch also preserves the entire original site.
 */
export function ContrastFindingPreview() {
  const previewRef = useRef<HTMLDivElement>(null);
  const remediationRef = useRef<HTMLImageElement>(null);
  const [started, setStarted] = useState(false);
  const [remediationReady, setRemediationReady] = useState(false);
  const [remediationFailed, setRemediationFailed] = useState(false);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    // Keep the original thumbnail entirely static when testing or recovering.
    if (new URLSearchParams(window.location.search).get('contrast-motion') === 'off') {
      setStaticMode(true);
      return;
    }

    if (remediationRef.current?.complete && remediationRef.current.naturalWidth > 0) {
      setRemediationReady(true);
    }

    const preview = previewRef.current;
    if (!preview) return;

    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }

    // Play once, and only when there is enough of the card in view to notice.
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) return;
        observer.disconnect();
        setStarted(true);
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  const canAnimate = !staticMode && !remediationFailed && remediationReady;

  return (
    <div
      ref={previewRef}
      className={`contrast-finding-preview${canAnimate ? ' is-ready' : ' is-static'}${canAnimate && started ? ' is-playing' : ''}`}
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
        onError={() => setRemediationFailed(true)}
      />
      {canAnimate && (
        <div className="contrast-preview-sequence" aria-hidden="true">
          <span className="contrast-preview-step contrast-preview-step-first">Finding</span>
          <span className="contrast-preview-direction">→</span>
          <span className="contrast-preview-step contrast-preview-step-second">Remediation</span>
        </div>
      )}
    </div>
  );
}
