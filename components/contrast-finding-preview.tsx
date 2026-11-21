'use client';
/* oxlint-disable next/no-img-element -- A real local product screenshot with a precisely aligned SVG motion overlay. */

import { useEffect, useRef, useState } from 'react';

/**
 * A restrained, one-shot attack-path moment on the real Contrast incident UI.
 *
 * Story: close graph → hot signal → entity impact → cooling blue continuation
 * → camera settles on the actual screen. The final screen remains visible.
 *
 * Fallback: /?contrast-motion=off, prefers-reduced-motion, or image load failure
 * shows the original project thumbnail without any artificial overlay.
 */
export function ContrastFindingPreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const sceneImageRef = useRef<HTMLImageElement>(null);
  const [enteredView, setEnteredView] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('contrast-motion') === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setStaticMode(true);
      return;
    }

    if (sceneImageRef.current?.complete && sceneImageRef.current.naturalWidth > 0) {
      setImageReady(true);
    }

    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === 'undefined') {
      setEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        // Never finish the one-shot animation before the visitor gets here.
        if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) {
          observer.disconnect();
          setEnteredView(true);
        }
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const animate = !staticMode && !imageFailed && imageReady;
  const playing = animate && enteredView;

  // These curves follow the visible incident route in the 1077 × 1800 screenshot:
  // source application (337, 790) → GET/customer_info (475, 790) →
  // outbound call (601, 790) → file operation (729, 790) →
  // storage query (854, 790).
  const hotPath = 'M 351 790 C 372 780, 391 784, 414 785 S 446 788, 462 790';
  const coolPath = 'M 489 790 C 518 784, 555 786, 589 790 S 675 788, 716 790 S 801 788, 840 790';

  return (
    <div
      ref={cardRef}
      className={`contrast-finding-preview${animate ? ' is-ready' : ' is-static'}${playing ? ' is-playing' : ''}`}
    >
      <img
        className="contrast-preview-finding"
        src="/portfolio/cards-cont@2x.png"
        alt="Contrast Security NorthStar interface preview"
        width={1440}
        height={1080}
        decoding="async"
      />

      <div className="contrast-real-screen" aria-hidden="true">
        <img
          ref={sceneImageRef}
          className="contrast-real-screen-image"
          src="/case-studies/incident-tour-screen-final.jpg"
          alt=""
          width={1077}
          height={1800}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageReady(true)}
          onError={() => setImageFailed(true)}
        />
        <svg
          className="contrast-trace-overlay"
          viewBox="0 0 1077 1800"
          preserveAspectRatio="xMinYMin meet"
          aria-hidden="true"
        >
          <path className="contrast-trace-hot-trail" d={hotPath} pathLength={100} />
          <path className="contrast-trace-hot-head" d={hotPath} pathLength={100} />
          <circle className="contrast-entity-impact" cx="475" cy="790" r="16" />
          <path className="contrast-trace-cool-trail" d={coolPath} pathLength={100} />
          <path className="contrast-trace-cool-head" d={coolPath} pathLength={100} />
          <circle className="contrast-end-glow" cx="854" cy="790" r="15" />
        </svg>
      </div>
    </div>
  );
}
