'use client';
/* oxlint-disable next/no-img-element -- These are real local case-study assets rendered inside a small motion study. */

import { useEffect, useRef, useState } from 'react';

/**
 * Contrast homepage: a restrained presentation of the real NorthStar screen.
 *
 * A thin, minimally rendered laptop makes a very small perspective turn
 * when its project card enters view. The device is deliberately not a
 * photorealistic reconstruction: no fake keyboard keys, highlights or props.
 *
 * The original project thumbnail remains the fallback for JS disabled,
 * missing assets, prefers-reduced-motion and ?contrast-motion=off.
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
        alt="Contrast Security NorthStar dashboard displayed on a laptop"
        width={1440}
        height={1080}
        decoding="async"
      />
      <div className="contrast-laptop-scene" aria-hidden="true">
        <div className="contrast-laptop-device">
          <div className="contrast-laptop-lid">
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
          <div className="contrast-laptop-deck" />
        </div>
      </div>
    </div>
  );
}
