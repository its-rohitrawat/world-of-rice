'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowIcon, PhoneIcon } from './Icons';
import WhatsAppButton from './WhatsAppButton';
import { site, telLink } from '@/lib/site';
import { calm, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { clearPage, colour, setPage } from '@/lib/palette';
import { grainSet, grainSrc, packSet, packSrc, photoSet, type Product } from '@/lib/products';

const DARK = '#2F231E';

/** The big faded name behind the bowl: the first two words, or one if that is already long. */
function shortName(name: string) {
  const w = name.split(/\s+/);
  const two = w.slice(0, 2).join(' ');
  return (two.length > 16 ? w[0] : two).toUpperCase();
}

/** The first sentence of the about text gets the large type; the rest follows in body text. */
function story(about: string[]) {
  const text = about.join(' ').trim();
  const m = text.match(/^(.+?[.!?])\s+(.+)$/s);
  return m ? { big: m[1], rest: m[2] } : { big: text, rest: '' };
}

/** Product page as a scroll story: the bowl, the grain, the story, the pack, then ordering. */
export default function ProductView({ product: p, related, next, total }: { product: Product; related: Product[]; next: Product; total: number }) {
  const root = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(p.sizes[0]);

  const grains = p.photos.filter(f => f.type === 'grain');
  const grainPhoto = grains[grains.length - 1];
  const back = p.photos.find(f => f.type === 'back');
  const rows = p.facts
    ? [['Grain', p.facts.grain], ['Cooks', p.facts.cooks], ['Known for', p.facts.knownFor]]
    : [...(p.families.length ? [['Family', p.families.join(', ')]] : []), ['Pack sizes', p.sizes.join(', ')]];
  const tale = story(p.about);
  const more = related.slice(0, 4);
  const sizesLine = p.sizes.length === 1 ? `It comes in a ${p.sizes[0]} pack.` : `It comes in ${p.sizes.length} sizes.`;

  useGSAP(() => {
    // the menu bar takes the colour of the chapter under it
    setPage(DARK, true);
    gsap.utils.toArray<HTMLElement>('[data-bg]', root.current).forEach(el =>
      ScrollTrigger.create({
        trigger: el, start: 'top 9%', end: 'bottom 9%',
        onToggle: s => { if (s.isActive) setPage(el.dataset.bg!, el.dataset.dark === '1'); },
      }));
    if (!calm()) {
      const q = gsap.utils.selector(root);
      gsap.from(q('.ps-bowl'), { y: 50, scale: 0.9, autoAlpha: 0, duration: 1.3, ease: 'power3.out' });
      gsap.from(q('.ps-giant'), { y: 40, autoAlpha: 0, duration: 1.6, ease: 'power2.out' });
      gsap.from(q('.ps-hero-in > :not(.ps-bowl), .ps-back'), { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.08, delay: 0.35, ease: 'power3.out' });
      // a little depth while the hero scrolls away
      gsap.to(q('.ps-giant'), { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.ps-hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.ps-bowl'), { rotation: 14, ease: 'none', scrollTrigger: { trigger: '.ps-hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.fromTo(q('.ps-grain-pic img'), { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.ps-grain', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.utils.toArray<HTMLElement>('.ps-rise', root.current).forEach(el =>
        gsap.from(el.children, { y: 34, autoAlpha: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 80%' } }));
    }
    return () => clearPage();
  }, { scope: root });

  let n = 0;
  const num = () => String(++n).padStart(2, '0');

  return (
    <div ref={root} className="ps">
      <section className="ps-hero" data-bg={DARK} data-dark="1">
        <Link className="ps-back" href="/#catalogue"><ArrowIcon /><span>All rice</span></Link>
        <p className="ps-giant" aria-hidden="true">{shortName(p.name)}</p>
        <div className="ps-hero-in">
          <img className={p.hasGrain ? 'ps-bowl' : 'ps-bowl ps-bowl-pack'} src={grainSrc(p)} srcSet={grainSet(p)} sizes="(max-width: 820px) 78vw, 520px"
            alt={p.hasGrain ? `${p.name} rice in a brass bowl` : `${p.name} pack`} fetchPriority="high" />
          {p.families.length > 0 && <p className="ps-fams">{p.families.join(' · ')}</p>}
          <h1>{p.name}</h1>
          <p className="ps-line">{p.line}</p>
          <a className="btn ps-cta" href="#order">Order this rice</a>
        </div>
      </section>

      <section className="ps-grain" data-bg={colour.forest} data-dark="1" aria-labelledby="ps-grain-h">
        <div className={grainPhoto ? 'ps-grain-pic' : 'ps-grain-pic ps-grain-pack'}>
          {grainPhoto
            ? <img src={grainPhoto.src} srcSet={photoSet(grainPhoto.src)} sizes="(max-width: 820px) 100vw, 50vw" alt={`${p.name} grains, close up`} loading="lazy" />
            : <img src={packSrc(p)} srcSet={packSet(p)} sizes="(max-width: 820px) 60vw, 30vw" alt={`${p.name} pack`} loading="lazy" />}
        </div>
        <div className="ps-grain-txt ps-rise">
          <p className="ps-num">{num()}</p>
          <h2 id="ps-grain-h">The grain</h2>
          <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        </div>
      </section>

      <section className="ps-story" data-bg={colour.sienna} data-dark="1" aria-labelledby="ps-story-h">
        <div className="ps-rise">
          <p className="ps-num">{num()}</p>
          <h2 id="ps-story-h">About this rice</h2>
          <p className="ps-big">{tale.big}</p>
          {tale.rest && <p className="ps-body">{tale.rest}</p>}
        </div>
      </section>

      <section className="ps-pack" data-bg={colour.cream} data-dark="0" aria-labelledby="ps-pack-h">
        <div className="ps-pack-txt ps-rise">
          <p className="ps-num">{num()}</p>
          <h2 id="ps-pack-h">The pack</h2>
          <p>Look for this pack on our shelves. {sizesLine}</p>
          <ul aria-label="Pack sizes">{p.sizes.map(s => <li key={s}>{s}</li>)}</ul>
        </div>
        <div className="ps-pack-pics">
          <img className="ps-pack-front" src={packSrc(p)} srcSet={packSet(p)} sizes="(max-width: 820px) 46vw, 300px" alt={`Front of the ${p.name} pack`} loading="lazy" />
          {back && <img className="ps-pack-back" src={back.src} srcSet={photoSet(back.src)} sizes="(max-width: 820px) 44vw, 300px" alt={`Back of the ${p.name} pack`} loading="lazy" />}
        </div>
      </section>

      <section className="ps-order" id="order" data-bg={colour.gold} data-dark="0" aria-labelledby="ps-order-h">
        <div className="ps-rise">
          <h2 id="ps-order-h">Order {p.name}</h2>
          <div className="ps-sizes" role="group" aria-label="Pack size">
            {p.sizes.map(s => <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}>{s}</button>)}
          </div>
          <div className="ps-order-btns">
            <WhatsAppButton product={`${p.name} (${size})`} />
            <a className="btn" href={telLink}><PhoneIcon /><span>Call {site.phone}</span></a>
          </div>
          <p className="ps-hours">Gurugram and Sohna stores &middot; {site.hours}</p>
        </div>
      </section>

      <section className="ps-more" data-bg={DARK} data-dark="1" aria-labelledby="ps-more-h">
        <h2 id="ps-more-h">{p.families[0] ? `More ${p.families[0]} rice` : 'More rice to try'}</h2>
        <div className="ps-more-grid">
          {more.map(r => (
            <Link key={r.slug} href={`/rice/${r.slug}`} prefetch={false}>
              <img src={grainSrc(r)} srcSet={grainSet(r)} sizes="(max-width: 820px) 40vw, 260px" alt="" loading="lazy" />
              <span>{r.name}</span>
            </Link>
          ))}
        </div>
        <div className="ps-more-end">
          <Link href="/#catalogue">See all {total} varieties</Link>
          <Link href={`/rice/${next.slug}`}>Next: {next.name} <ArrowIcon /></Link>
        </div>
      </section>
    </div>
  );
}
