'use client';

import { createContext, createElement, useContext, useEffect, useRef, type ReactNode } from 'react';

export const ScrambleHeadings = createContext(false);

/** Keep authored text in the accessibility tree and reserve every glyph's width. */
export function ScrambleHeading({ tag, attributes, children }: {
  tag: string;
  attributes: Record<string, unknown>;
  children: ReactNode;
}) {
  const enabled = useContext(ScrambleHeadings);
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = ref.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!enabled || !heading || motion.matches || !('IntersectionObserver' in window)) return;
    let frame = 0;
    let restore: (() => void) | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const nodes: Text[] = [];
      while (walker.nextNode()) nodes.push(walker.currentNode as Text);
      const replacements: { original: Text; wrapper: HTMLSpanElement }[] = [];
      const glyphs: { element: HTMLSpanElement; letter: string }[] = [];
      for (const original of nodes) {
        const wrapper = document.createElement('span');
        const accessible = document.createElement('span');
        accessible.className = 'scramble-accessible';
        accessible.textContent = original.data;
        wrapper.appendChild(accessible);
        const visual = document.createElement('span');
        visual.setAttribute('aria-hidden', 'true');
        for (const token of original.data.split(/(\s+)/)) {
          if (/^\s*$/.test(token)) { visual.append(token); continue; }
          const word = document.createElement('span');
          word.className = 'scramble-word';
          for (const letter of Array.from(token)) {
            const cell = document.createElement('span');
            cell.className = 'scramble-cell';
            const reserve = document.createElement('span');
            reserve.className = 'scramble-reserve';
            reserve.textContent = letter;
            const ink = document.createElement('span');
            ink.className = 'scramble-ink';
            ink.textContent = letter;
            cell.appendChild(reserve); cell.appendChild(ink);
            word.appendChild(cell);
            if (/[a-z0-9]/i.test(letter)) glyphs.push({ element: ink, letter });
          }
          visual.appendChild(word);
        }
        wrapper.appendChild(visual);
        original.replaceWith(wrapper);
        replacements.push({ original, wrapper });
      }
      restore = () => {
        cancelAnimationFrame(frame);
        for (const { original, wrapper } of replacements) wrapper.replaceWith(original);
      };
      // Shuffle resolution order independently of each letter's position.
      const order = glyphs.map((_, index) => index);
      for (let index = order.length - 1; index > 0; index--) {
        const swap = Math.floor(Math.random() * (index + 1));
        [order[index], order[swap]] = [order[swap], order[index]];
      }
      const settleAt: number[] = [];
      order.forEach((index, rank) => {
        settleAt[index] = 120 + (rank / Math.max(1, order.length - 1)) * 420;
      });
      const letters = glyphs.map(({ letter }) => letter);
      const start = performance.now();
      let lastTick = -1;
      const animate = (now: number) => {
        const elapsed = now - start;
        if (elapsed >= 600 || motion.matches) { restore?.(); return; }
        const tick = Math.floor(elapsed / 60);
        if (tick !== lastTick) {
          lastTick = tick;
          glyphs.forEach(({ element, letter }, index) => {
            const settled = elapsed >= settleAt[index];
            element.textContent = settled ? letter : letters[Math.floor(Math.random() * letters.length)];
          });
        }
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }, { threshold: 0.15 });
    const stop = () => { if (motion.matches) { observer.disconnect(); restore?.(); } };
    motion.addEventListener('change', stop);
    observer.observe(heading);
    return () => { observer.disconnect(); restore?.(); motion.removeEventListener('change', stop); };
  }, [enabled]);
  return createElement(tag, { ...attributes, ref }, children);
}
