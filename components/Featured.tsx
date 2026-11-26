'use client';
import Link from 'next/link';
import { useRef, type CSSProperties } from 'react';
import Burst, { type BurstHandle } from './Burst';
import { ArrowIcon } from './Icons';
import { crestClip } from '@/lib/crest';
import { calm, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { featuredTones, setPage } from '@/lib/palette';
import { grainSet, grainSrc, packSet, packSrc, type Product } from '@/lib/products';

// Colour of the thrown grains, taken from each featured rice.
const GRAIN: Record<string, [number, number, number]> = {
  'kali-mooch': [0.98, 0.96, 0.9], 'double-chabi-golden-sella-basmati': [0.96, 0.82, 0.5], 'south-sona-mansoori-rice': [0.99, 0.97, 0.92],
  'black-rice': [0.3, 0.2, 0.2], 'naira-zeeba-golden-sella-mongra': [0.93, 0.76, 0.44],
};

export default function Featured({ products }: { products: Product[] }) {
  const root = useRef<HTMLElement>(null);
  const burst = useRef<BurstHandle>(null);
  const tone = (i: number) => featuredTones[i % featuredTones.length];

  useGSAP(() => {
    const still = calm();
    const panels = gsap.utils.toArray<HTMLElement>('.fp');
    const [back, next] = gsap.utils.toArray<HTMLButtonElement>('.fp-nav button');
    const count = root.current!.querySelector('.fp-nav span')!;
    const N = panels.length;
    let cur = 0, inside = false, playing: gsap.core.Timeline | null = null;
    const part = (i: number, s: string) => panels[i].querySelectorAll(s);
    const page = () => { if (inside) setPage(tone(cur).bg, tone(cur).dark); };
    const nav = root.current!.querySelector<HTMLElement>('.fp-nav')!;
    const mark = () => { nav.style.setProperty('--i', tone(cur).ink); nav.style.setProperty('--c', tone(cur).bg); count.textContent = `${cur + 1} of ${N}`; back.disabled = cur === 0; next.disabled = cur === N - 1; };

    gsap.set(panels, { visibility: 'hidden', zIndex: 0 });
    gsap.set(panels[0], { visibility: 'visible', zIndex: 1 });
    mark();

    function go(to: number) {
      if (to === cur) return;
      playing?.progress(1);
      const from = cur, dir = to > from ? 1 : -1, rgb = GRAIN[products[to].slug] ?? [0.98, 0.95, 0.88];
      cur = to;
      mark();
      const inn = panels[to], out = panels[from];
      const done = () => {
        gsap.set(out, { visibility: 'hidden', zIndex: 0 });
        gsap.set(inn, { zIndex: 1, clipPath: 'none' });
        gsap.set(part(from, '.fp-txt > *, .fp-art, .fp-h b'), { clearProps: 'all' });
        burst.current?.clear();
        playing = null;
      };
      gsap.set(inn, { visibility: 'visible', zIndex: 2, clipPath: still ? 'none' : crestClip(0, dir) });
      if (still) { done(); page(); return; }

      const p = { t: 0 };
      const tl = gsap.timeline({ onComplete: done });
      playing = tl;
      tl.to(p, {
        t: 1.5, duration: 1.95, ease: 'none',
        onUpdate: () => {
          inn.style.clipPath = p.t < 1 ? crestClip(p.t, dir) : 'none';
          burst.current?.draw(p.t, dir, rgb);
        },
      }, 0);
      tl.add(page, 0.6);
      // the rice on screen is lifted away
      tl.to(part(from, '.fp-art'), { yPercent: -22 * dir, scale: 0.86, rotation: -3 * dir, duration: 0.95, ease: 'power2.in' }, 0);
      tl.to(part(from, '.fp-txt > *'), { y: -46 * dir, autoAlpha: 0, duration: 0.5, stagger: 0.03, ease: 'power2.in' }, 0);
      // the next one lands: heap first, pack swings in behind it, then the words
      tl.fromTo(part(to, '.fp-grain'), { yPercent: 95 * dir, scale: 0.7, rotation: -9 * dir }, { yPercent: 0, scale: 1, rotation: 0, duration: 1.15, ease: 'back.out(1.3)' }, 0.62);
      tl.fromTo(part(to, '.fp-pack'), { yPercent: 70 * dir, rotation: 20 * dir, scale: 0.8 }, { yPercent: 0, rotation: 4, scale: 1, duration: 1.2, ease: 'back.out(1.1)' }, 0.72);
      tl.fromTo(part(to, '.fp-ring'), { scale: 0.4, rotation: -60, autoAlpha: 0 }, { scale: 1, rotation: 0, autoAlpha: 1, duration: 1.2, ease: 'power3.out' }, 0.6);
      tl.fromTo(part(to, '.fp-h b'), { yPercent: 115 }, { yPercent: 0, duration: 0.95, stagger: 0.07, ease: 'power4.out' }, 0.82);
      tl.fromTo(part(to, '.fp-txt > :not(.fp-h)'), { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.07, ease: 'power3.out' }, 0.98);
    }

    const st = ScrollTrigger.create({
      trigger: root.current, start: 'top top', end: () => `+=${N * 62}%`, pin: true,
      onUpdate: s => go(Math.min(N - 1, Math.floor(s.progress * N * 0.9999))),
    });
    ScrollTrigger.create({
      trigger: root.current, start: 'top 55%', end: () => `+=${N * 62 + 100}%`,
      onToggle: s => { inside = s.isActive; page(); },
    });
    const goTo = (k: number) => window.scrollTo({ top: st.start + (st.end - st.start) * ((k + 0.5) / N), behavior: 'instant' });
    back.addEventListener('click', () => goTo(Math.max(0, cur - 1)));
    next.addEventListener('click', () => goTo(Math.min(N - 1, cur + 1)));

    // first rice arrives as the section does
    if (!still) {
      gsap.from(part(0, '.fp-grain'), { yPercent: 60, scale: 0.8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 85%', end: 'top 5%', scrub: 0.6 } });
      gsap.from(part(0, '.fp-pack'), { yPercent: 40, rotation: 18, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 5%', scrub: 0.6 } });
      // a little depth under the cursor
      const move = (e: PointerEvent) => {
        if (!inside) return;
        const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
        gsap.to('.fp-grain img', { x: x * 22, y: y * 12, duration: 0.9, overwrite: 'auto', ease: 'power2.out' });
        gsap.to('.fp-pack img', { x: x * -14, y: y * -8, duration: 0.9, overwrite: 'auto', ease: 'power2.out' });
      };
      addEventListener('pointermove', move, { passive: true });
      return () => removeEventListener('pointermove', move);
    }
  }, { scope: root });

  return (
    <section className="feat" id="featured" ref={root}>
      {products.map((p, i) => {
        const t = tone(i);
        return (
          <article className="fp" key={p.slug} style={{ '--c': t.bg, '--i': t.ink, '--a': t.accent } as CSSProperties}>
            <div className="fp-txt">
              <p className="fp-fam">{p.families[0]}</p>
              <h2 className="fp-h">{p.name.split(' ').map((w, k) => <span key={k}><b>{w}</b>{' '}</span>)}</h2>
              <p className="fp-line">{p.line}</p>
              {p.facts && <dl><div><dt>Grain</dt><dd>{p.facts.grain}</dd></div><div><dt>Cooks</dt><dd>{p.facts.cooks}</dd></div><div><dt>Known for</dt><dd>{p.facts.knownFor}</dd></div></dl>}
              <Link className="fp-link" href={`/rice/${p.slug}`}>See this rice</Link>
            </div>
            <div className="fp-art">
              <span className="fp-ring" />
              <span className="fp-pack"><img src={packSrc(p)} srcSet={packSet(p)} sizes="(max-width: 820px) 40vw, 24vw" alt={`${p.name} pack`} loading="lazy" decoding="async" /></span>
              <span className="fp-grain"><img src={grainSrc(p)} srcSet={grainSet(p)} sizes="(max-width: 820px) 44vw, 26vw" alt={`${p.name} rice in a brass bowl`} loading="lazy" decoding="async" /></span>
            </div>
          </article>
        );
      })}
      <Burst ref={burst} />
      <div className="fp-nav"><button type="button" className="back"><ArrowIcon />Back</button><span aria-live="polite" /><button type="button">Next<ArrowIcon /></button></div>
    </section>
  );
}
