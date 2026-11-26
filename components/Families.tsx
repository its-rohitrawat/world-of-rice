'use client';
import { useRef, type CSSProperties } from 'react';
import { calm, gsap, useGSAP } from '@/lib/gsap';
import { familyCards, fallbackCard } from '@/lib/palette';

export type Family = { name: string; total: number };
const file = (name: string) => `/bowl/${name.toLowerCase().replace(/\s+/g, '-')}.webp`;
const fileSet = (name: string) => `${file(name).replace(/\.webp$/, '-360.webp')} 360w, ${file(name)} 900w`;

/** A hand of cards standing in the heap. They deal out on scroll; choosing one opens that family. */
export default function Families({ families, onPick }: { families: Family[]; onPick: (name: string) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);

  useGSAP(() => {
    const fan = root.current!;
    const cards = gsap.utils.toArray<HTMLElement>('.fcard');
    const turns = gsap.utils.toArray<HTMLElement>('.fcard-turn');
    const lifts = gsap.utils.toArray<HTMLElement>('.fcard-in');
    const mid = (cards.length - 1) / 2;
    const mm = gsap.matchMedia();

    mm.add({ wide: '(min-width: 821px)', small: '(max-width: 820px)' }, ctx => {
      const small = ctx.conditions!.small, step = 10.1;
      const origin = '50% 330%';
      gsap.set(turns, { transformOrigin: origin });
      const angle = (i: number) => (i - mid) * step;

      if (small) {
        // phones: all nine at once, no swiping to find them
        if (!calm()) gsap.from(cards, { y: 130, autoAlpha: 0, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: fan.closest('.fam-wrap'), start: 'top 12%', end: 'top -46%', scrub: 0.8 } });
        return;
      }
      if (calm()) {
        gsap.set(cards, { transformOrigin: origin, rotation: i => angle(i) });
      } else {
        // dealt from inside the heap, middle card first
        const tl = gsap.timeline({ scrollTrigger: { trigger: fan.closest('.fam-wrap'), start: 'top 14%', end: 'top -64%', scrub: 0.8 } });
        cards.forEach((c, i) => {
          const d = Math.abs(i - mid);
          tl.fromTo(c, { transformOrigin: origin, yPercent: 225, scale: 0.8, rotation: 0 }, { yPercent: 0, scale: 1, rotation: 0, duration: 0.5, ease: 'power3.out' }, d * 0.02);
          tl.to(c, { rotation: angle(i), duration: 0.75, ease: 'power3.inOut' }, 0.34 + d * 0.035);
        });
      }

      // the pointed card lifts out; its neighbours make room
      const point = (k: number | null) => {
        turns.forEach((t, j) => gsap.to(t, { rotation: k === null || j === k ? 0 : Math.sign(j - k) * Math.max(0, 4.6 - Math.abs(j - k) * 0.9), duration: 0.55, ease: 'power3.out', overwrite: 'auto' }));
        lifts.forEach((l, j) => gsap.to(l, { y: j === k ? -34 : 0, scale: j === k ? 1.1 : 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }));
        cards.forEach((c, j) => c.classList.toggle('up', j === k));
      };
      const enter = cards.map((c, k) => { const f = () => point(k); c.addEventListener('pointerenter', f); c.addEventListener('focusin', f); return f; });
      const leave = () => point(null);
      fan.addEventListener('pointerleave', leave);
      fan.addEventListener('focusout', leave);

      // the whole hand can be turned by dragging to bring an outer card closer
      let from: { x: number; s: number } | null = null, spin = 0;
      const limit = mid * step * 0.45;
      const down = (e: PointerEvent) => { from = { x: e.clientX, s: spin }; moved.current = false; };
      const drag = (e: PointerEvent) => {
        if (!from) return;
        const dx = e.clientX - from.x;
        if (Math.abs(dx) > 8) moved.current = true;
        spin = gsap.utils.clamp(-limit, limit, from.s + dx * 0.06);
        gsap.to(fan, { rotation: spin, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      };
      const up = () => { from = null; };
      fan.addEventListener('pointerdown', down);
      window.addEventListener('pointermove', drag, { passive: true });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      return () => {
        cards.forEach((c, k) => { c.removeEventListener('pointerenter', enter[k]); c.removeEventListener('focusin', enter[k]); });
        fan.removeEventListener('pointerleave', leave); fan.removeEventListener('focusout', leave);
        fan.removeEventListener('pointerdown', down);
        window.removeEventListener('pointermove', drag); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
        gsap.set(fan, { rotation: 0 });
      };
    });
  }, { scope: root });

  return (
    <div className="fan" ref={root}>
      {families.map((f, i) => {
        const t = familyCards[f.name] ?? fallbackCard;
        return (
          <div className="fcard" key={f.name} style={{ '--c1': t.from, '--c2': t.to, '--i': t.ink, '--cap': t.cap, zIndex: i + 1 } as CSSProperties}>
            <div className="fcard-turn">
              <a className="fcard-in" href="#catalogue" draggable={false} onClick={e => { e.preventDefault(); if (!moved.current) onPick(f.name); }}>
                <b>{f.name.split(' ').map(w => <span key={w}>{w}</span>)}</b>
                <img src={file(f.name)} srcSet={fileSet(f.name)} sizes="(max-width: 820px) 30vw, 190px" alt="" draggable={false} decoding="async" />
                <small>{f.total} varieties</small>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
