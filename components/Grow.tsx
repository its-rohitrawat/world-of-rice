'use client';
import Link from 'next/link';
import { useRef, type CSSProperties } from 'react';
import { growth } from '@/lib/content';
import { calm, gsap, useGSAP } from '@/lib/gsap';

const longest = Math.max(...growth.map(g => g.cooked));
const pct = (mm: number) => `${(mm / longest) * 100}%`;

/** Each grain drawn to scale by length: raw, then cooked. */
export default function Grow() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (calm()) return;
    gsap.utils.toArray<HTMLElement>('.grow-row').forEach(row => {
      const g = row.querySelector<HTMLElement>('.grow-cooked')!;
      gsap.fromTo(g, { width: getComputedStyle(row).getPropertyValue('--raw') }, { width: getComputedStyle(row).getPropertyValue('--cooked'), duration: 1.6, ease: 'power2.inOut', scrollTrigger: { trigger: row, start: 'top 84%' } });
    });
  }, { scope: root });

  return (
    <div className="grow" ref={root}>
      <h2>See how much it grows</h2>
      <p className="grow-lead">Average length of one grain, before and after cooking. Drawn to scale.</p>
      <ul>
        {growth.map(g => (
          <li className="grow-row" key={g.slug} style={{ '--raw': pct(g.raw), '--cooked': pct(g.cooked) } as CSSProperties}>
            <Link href={`/rice/${g.slug}`}>{g.name}</Link>
            <div className="grow-bars">
              <span className="grow-line"><i className="grow-raw" /><em>{g.raw.toFixed(2)} mm raw</em></span>
              <span className="grow-line"><i className="grow-cooked" /><em>{g.cooked.toFixed(2)} mm cooked</em></span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
