'use client';
/* oxlint-disable next/no-img-element -- The preview pans an existing local case-study image; no remote images. */

import { useEffect, useRef, useState } from 'react';

/**
 * Gauge → connected-entity graph → graph with entity side sheet.
 *
 * Uses a screenshot already present in the Contrast incident walkthrough.
 * The sheet reuses the sample entity's metadata in that walkthrough.
 * Autoplays once when visible, holds the graph/details, and falls back to
 * the original static card on image error, reduced motion, or
 * /?contrast-motion=off.
 */
export function ContrastFindingPreview() {
  const previewRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLImageElement>(null);
  const [started, setStarted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('contrast-motion') === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setStaticMode(true);
      return;
    }

    if (sceneRef.current?.complete && sceneRef.current.naturalWidth > 0) {
      setSceneReady(true);
    }
    const card = previewRef.current;
    if (!card) return;
    if (typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) return;
        observer.disconnect();
        setStarted(true);
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const ready = !staticMode && !sceneFailed && sceneReady;

  return (
    <div
      ref={previewRef}
      className={`contrast-finding-preview${ready && started ? ' is-playing' : ' is-static'}`}
    >
      <img
        className="contrast-preview-finding"
        src="/portfolio/cards-cont@2x.png"
        alt="Contrast Security NorthStar interface preview"
        width={1440}
        height={1080}
        decoding="async"
      />
      <div className="contrast-pan-world" aria-hidden="true">
        <img
          ref={sceneRef}
          className="contrast-pan-image"
          src="/case-studies/incident-tour-screen-final.jpg"
          alt=""
          width={1077}
          height={1800}
          loading="lazy"
          decoding="async"
          onLoad={() => setSceneReady(true)}
          onError={() => setSceneFailed(true)}
        />
      </div>
      <div className="contrast-entity-sheet" aria-hidden="true">
        <div className="contrast-sheet-head">
          <span>Entity details</span>
          <span className="contrast-sheet-close">×</span>
        </div>
        <strong className="contrast-entity-name">petclinic-demo-2.5-ss3</strong>
        <span className="contrast-entity-type">Application · Production</span>
        <div className="contrast-sheet-row"><span>Severity</span><b className="contrast-critical">Critical</b></div>
        <div className="contrast-sheet-row"><span>Open incidents</span><b>3</b></div>
        <div className="contrast-sheet-row"><span>Related issues</span><b>14</b></div>
        <div className="contrast-sheet-row"><span>Affected endpoints</span><b>4</b></div>
        <div className="contrast-sheet-row"><span>Owner</span><b>Platform Engineering</b></div>
      </div>
      {ready && (
        <div className="contrast-pan-status" aria-hidden="true">
          <span className="contrast-status-gauge">Risk posture</span>
          <span className="contrast-status-graph">Entity graph</span>
          <span className="contrast-status-detail">Entity details</span>
        </div>
      )}
    </div>
  );
}
