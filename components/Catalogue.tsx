'use client';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import RiceCard from './RiceCard';
import { calm, Flip, gsap, ScrollTrigger } from '@/lib/gsap';
import type { Product } from '@/lib/products';

export default function Catalogue({ products, families }: { products: Product[]; families: string[] }) {
  const [fam, setFam] = useState('All');
  const [term, setTerm] = useState('');
  const grid = useRef<HTMLDivElement>(null);
  const before = useRef<Flip.FlipState | null>(null);
  const keep = () => { if (grid.current && !calm()) before.current = Flip.getState(grid.current.children); };

  useEffect(() => {
    const on = (e: Event) => { setTerm(''); setFam((e as CustomEvent<string>).detail); };
    window.addEventListener('family', on);
    return () => window.removeEventListener('family', on);
  }, []);

  const shown = useMemo(() => {
    const t = term.trim().toLowerCase();
    return new Set(products.filter(p => (fam === 'All' || p.families.includes(fam)) && (!t || p.name.toLowerCase().includes(t))).map(p => p.slug));
  }, [products, fam, term]);

  useLayoutEffect(() => {
    if (before.current && grid.current) {
      Flip.from(before.current, {
        duration: 0.5, ease: 'power3.inOut', absolute: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, clearProps: 'opacity,transform' }),
        onLeave: els => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.25 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
      before.current = null;
    } else {
      ScrollTrigger.refresh();
    }
  }, [shown]);

  return (
    <section className="cat" id="catalogue" data-theme="light">
      <div className="cat-head">
        <h2>{fam === 'All' ? 'All varieties' : fam}</h2>
        <label className="cat-find">
          <span className="sr">Find a rice by name</span>
          <input type="search" placeholder="Find a rice" value={term} onChange={e => { keep(); setTerm(e.target.value); }} />
        </label>
      </div>
      <div className="cat-filters" role="group" aria-label="Rice family">
        {['All', ...families].map(f => <button key={f} type="button" aria-pressed={fam === f} onClick={() => { keep(); setFam(f); }}>{f}</button>)}
        <span className="cat-count" aria-live="polite">{shown.size} {shown.size === 1 ? 'variety' : 'varieties'}</span>
      </div>
      <div className="cat-grid" ref={grid}>
        {products.map(p => <RiceCard key={p.slug} product={p} hidden={!shown.has(p.slug)} />)}
      </div>
      {shown.size === 0 && <p className="cat-none">No rice matches that. Try a shorter name, or choose All.</p>}
    </section>
  );
}
