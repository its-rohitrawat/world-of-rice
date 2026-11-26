'use client';
import { useState } from 'react';
import RiceCard from './RiceCard';
import { dishes } from '@/lib/content';
import { gsap, calm, useGSAP } from '@/lib/gsap';
import { useRef } from 'react';
import type { Product } from '@/lib/products';

/** "What are you cooking?": pick a dish, see the rices that suit it. */
export default function Dishes({ products }: { products: Product[] }) {
  const [k, setK] = useState(0);
  const out = useRef<HTMLDivElement>(null);
  const dish = dishes[k];
  const rice = dish.rice.map(s => products.find(p => p.slug === s)).filter((p): p is Product => Boolean(p));

  useGSAP(() => {
    if (!calm() && out.current) gsap.fromTo(out.current.children, { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
  }, [k]);

  return (
    <div className="dish">
      <h2>What are you cooking?</h2>
      <div className="dish-tabs" role="tablist" aria-label="Dishes">
        {dishes.map((d, i) => (
          <button key={d.name} type="button" role="tab" id={`dish-${i}`} aria-selected={i === k} aria-controls="dish-panel" onClick={() => setK(i)}>{d.name}</button>
        ))}
      </div>
      <div className="dish-panel" id="dish-panel" role="tabpanel" aria-labelledby={`dish-${k}`}>
        <p className="dish-text">{dish.text}</p>
        <div className="dish-grid" ref={out}>{rice.map(p => <RiceCard key={p.slug} product={p} />)}</div>
      </div>
    </div>
  );
}
