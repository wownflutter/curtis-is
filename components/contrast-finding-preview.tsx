'use client';
/* oxlint-disable next/no-img-element -- This card uses existing local product images with a CSS-only device reveal. */

import { useEffect, useRef, useState } from 'react';

/**
 * A short, restrained laptop reveal for the Contrast project thumbnail.
 *
 * The dashboard displayed in the laptop is a real Contrast case-study image.
 * The lid moves the last few degrees of opening while the device turns
 * slightly toward the viewer, then holds without looping.
 *
 * Fallback: the original card image stays visible if the dashboard
 * screenshot fails, JS is unavailable, reduced motion is preferred,
 * or the page is opened with ?contrast-motion=off.
 */
export function ContrastFindingPreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLImageElement>(null);
  const [enteredView, setEnteredView] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const [screenFailed, setScreenFailed] = useState(false);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('contrast-motion') === 'off' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setStaticMode(true);
      return;
    }

    if (screenRef.current?.complete && screenRef.current.naturalWidth > 0) {
      setScreenReady(true);
    }

    const card = cardRef.current;
    if (!card || typeof IntersectionObserver === 'undefined') {
      setEnteredView(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.4)) return;
        observer.disconnect();
        setEnteredView(true);
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const ready = !staticMode && screenReady && !screenFailed;

  return (
    <div
      ref={cardRef}
      className={`contrast-finding-preview${ready ? ' is-ready' : ' is-static'}${ready && enteredView ? ' is-playing' : ''}`}
    >
      <img
        className="contrast-preview-finding"
        src="/portfolio/cards-cont@2x.png"
        alt="Contrast Security NorthStar dashboard shown on a laptop"
        width={1440}
        height={1080}
        decoding="async"
      />

      <div className="contrast-laptop-scene" aria-hidden="true">
        <div className="contrast-laptop-device">
          <div className="contrast-laptop-lid">
            <div className="contrast-laptop-camera" />
            <div className="contrast-laptop-screen">
              <img
                ref={screenRef}
                src="/case-studies/cont-phase3-insights.png"
                alt=""
                width={1920}
                height={2885}
                loading="eager"
                decoding="async"
                onLoad={() => setScreenReady(true)}
                onError={() => setScreenFailed(true)}
              />
            </div>
          </div>
          <div className="contrast-laptop-deck">
            <div className="contrast-laptop-keys">
              {Array.from({ length: 52 }, (_, index) => <span key={index} />)}
            </div>
            <div className="contrast-laptop-trackpad" />
          </div>
        </div>
      </div>
    </div>
  );
}
