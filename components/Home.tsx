'use client';
import Link from 'next/link';
import { useRef } from 'react';
import Catalogue from './Catalogue';
import Dishes from './Dishes';
import Families, { type Family } from './Families';
import Featured from './Featured';
import GrainField from './GrainField';
import { ArrowIcon, PhoneIcon, WhatsAppIcon } from './Icons';
import { numbers, questions } from '@/lib/content';
import { field } from '@/lib/field';
import { calm, gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { clearPage, colour, setPage } from '@/lib/palette';
import type { Product } from '@/lib/products';
import { site, telLink } from '@/lib/site';

const HERO_PICKS = [
  ['kali-mooch', 'Kali Mooch'], ['double-chabi-golden-sella-basmati', 'Double Chabi'], ['south-sona-mansoori-rice', 'South Sona Mansoori'],
  ['black-rice', 'Black Rice'], ['kalanamak-rice', 'Kala Namak'], ['naira-zeeba-golden-sella-mongra', 'Naira Zeeba Golden Mongra'],
] as const;

export default function Home({ products, featured, families }: { products: Product[]; featured: Product[]; families: Family[] }) {
  const root = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const still = calm();
    const q = gsap.utils.selector(root);

    // The grains leave the logo, drift, and pour into the heap as the cards screen arrives.
    const step = (from: number, to: number, start: string, end: string) =>
      gsap.fromTo(field, { stage: from }, { stage: to, ease: 'none', immediateRender: false, scrollTrigger: { trigger: '.fam-wrap', start, end, scrub: still ? true : 0.6 } });
    step(1, 2, 'top bottom', 'top 42%');
    step(2, 3, 'top 42%', 'top -18%');
    // the heap stands in front of the cards, so they rise out of the rice
    ScrollTrigger.create({ trigger: '.fam-wrap', start: 'top 45%', end: 'bottom top', toggleClass: { targets: '.field', className: 'front' } });
    // the next section slides up over the cards screen; once it covers it, the grains stop drawing
    ScrollTrigger.create({ trigger: '.lap', start: 'top top', end: 'max', onToggle: s => { field.on = !s.isActive; } });

    // Page colour follows the section.
    gsap.utils.toArray<HTMLElement>('[data-bg]', root.current).forEach(el =>
      ScrollTrigger.create({
        trigger: el, start: el.dataset.start ?? 'top 55%', end: el.dataset.end ?? 'bottom 55%',
        onToggle: s => { if (s.isActive) setPage(el.dataset.bg!, el.dataset.dark === '1'); },
      }));

    if (!still) {
      // the headline first and soon: it is the largest thing on the first screen, so the page counts as loaded when it shows
      gsap.from(q('.hero-in > *'), { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.08, delay: 0.1, ease: 'power3.out' });
      gsap.from(q('.hero-left > *, .hero-facts > div'), { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.06, delay: 0.45, ease: 'power3.out' });
      gsap.to(q('.hero-cols'), { autoAlpha: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.fam-wrap', start: 'top 92%', end: 'top 58%', scrub: true } });
      gsap.from(q('.fam-cta'), { autoAlpha: 0, y: 24, ease: 'none', scrollTrigger: { trigger: '.fam-wrap', start: 'top -46%', end: 'top -66%', scrub: 0.6 } });
      gsap.to(q('.hero-in'), { autoAlpha: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.fam-wrap', start: 'top 88%', end: 'top 50%', scrub: true } });
      gsap.from(q('.families h2, .families .fam-sub'), { autoAlpha: 0, y: 30, ease: 'none', scrollTrigger: { trigger: '.fam-wrap', start: 'top 45%', end: 'top 5%', scrub: 0.6 } });
      gsap.utils.toArray<HTMLElement>('.rise', root.current).forEach(el =>
        gsap.from(el.children, { autoAlpha: 0, y: 34, stagger: 0.1, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 82%' } }));
    }
    ScrollTrigger.sort();
    // Pinned sections change the page height, so a link such as /#catalogue is only right after measuring.
    // Fonts and pictures still settle after that, so check again until the visitor takes over.
    let alive = true, touched = false;
    const hands = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const touch = () => { touched = true; };
    hands.forEach(e => window.addEventListener(e, touch, { once: true, passive: true }));
    const settle = () => { if (!alive) return; ScrollTrigger.refresh(); if (!touched && location.hash.length > 1) jump(location.hash.slice(1)); };
    document.fonts.ready.then(settle);
    const timers = [350, 900, 1800].map(ms => window.setTimeout(settle, ms));

    // Menu links on this page go straight there behind the curtain, instead of scrolling through every animation.
    const onLink = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== '/' || url.hash.length < 2 || !document.getElementById(url.hash.slice(1))) return;
      if (a.closest('.fan')) return;                       // the cards have their own behaviour
      e.preventDefault();
      touched = true;
      cover(() => { history.pushState(null, '', url.hash); jump(url.hash.slice(1)); });
    };
    document.addEventListener('click', onLink, true);
    return () => {
      alive = false; timers.forEach(clearTimeout); document.removeEventListener('click', onLink, true);
      hands.forEach(e => window.removeEventListener(e, touch)); clearPage();
    };
  }, { scope: root });

  function jump(id: string) {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: (el.closest('.pin-spacer') ?? el).getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
  }

  // Cover the screen, do something, uncover. No racing past the sections in between.
  function cover(show: () => void) {
    const run = () => { show(); requestAnimationFrame(() => ScrollTrigger.update()); };
    if (calm()) { run(); return; }
    gsap.timeline()
      .set(veil.current, { transformOrigin: '50% 100%', autoAlpha: 1 })
      .fromTo(veil.current, { scaleY: 0 }, { scaleY: 1, duration: 0.45, ease: 'power3.inOut' })
      .add(run)
      .set(veil.current, { transformOrigin: '50% 0%' }, '+=0.18')
      .to(veil.current, { scaleY: 0, duration: 0.55, ease: 'power3.inOut' })
      .set(veil.current, { autoAlpha: 0 });
  }

  function pick(name: string) {
    cover(() => {
      window.dispatchEvent(new CustomEvent('family', { detail: name }));
      requestAnimationFrame(() => { jump('catalogue'); history.replaceState(null, '', '#catalogue'); });
    });
  }

  return (
    <div ref={root}>
      <GrainField />
      <div className="veil" ref={veil} aria-hidden="true" />

      <section className="hero" data-bg={colour.brown} data-dark="1">
        <div className="hero-cols">
          <section className="hero-left" aria-label="Featured varieties">
            <p className="eyebrow">Rice shop &middot; Gurugram</p>
            <p className="hero-lede">Rare grains from across India, sold by the kilo.</p>
            <p className="eyebrow eyebrow-soft">Featured varieties</p>
            <div className="chips">
              {HERO_PICKS.map(([slug, name]) => <Link key={slug} className="chip" href={`/rice/${slug}`}>{name}</Link>)}
            </div>
          </section>
          <section className="hero-facts" aria-label="Quick facts">
            <div><b>150+</b><span>varieties on the shelves at our Gurugram store</span></div>
            <div><b>{products.length}</b><span>listed here with grain, aroma and cooking notes</span></div>
            <div><i><WhatsAppIcon /></i><span>Order by call or WhatsApp. Store hours: {site.hours}</span></div>
          </section>
        </div>
        <div className="hero-in">
          <div>
            <h1 className="hero-line">Choose rice by the grain.</h1>
            <p className="hero-side">Over 150 varieties in our Gurugram store. {products.length} of them here.</p>
          </div>
          <div className="btns">
            <Link className="btn" href="#catalogue">See all rice</Link>
            <a className="btn btn-line" href={telLink}><PhoneIcon /><span>Call us</span></a>
          </div>
        </div>
      </section>

      <div className="fam-wrap" data-bg={colour.forest} data-dark="1" data-end="bottom bottom">
        <span className="fam-anchor" id="families" />
        <section className="families">
          <h2>Rice families</h2>
          <p className="fam-sub">Choose a card to see that rice</p>
          <Families families={families} onPick={pick} />
        </section>
        <div className="fam-top">
          <a className="fam-cta" href="#catalogue" onClick={() => window.dispatchEvent(new CustomEvent('family', { detail: 'All' }))}><span>Shop all</span><ArrowIcon /></a>
        </div>
      </div>

      <section className="sec lap" data-bg={colour.cream} data-dark="0" data-start="top top"><Dishes products={products} /></section>

      <section className="sec" id="story" data-bg={colour.sienna} data-dark="1">
        <div className="tale">
          <h2 className="rise"><span>Built by time, understanding, and devotion to rice.</span></h2>
          <div className="tale-cols rise">
            <div><h3>It began over 50 years ago</h3><p>Pran Nath Narang started the business in Gurugram. Others traded rice as a staple. He treated it as a craft, choosing grain with care and building trust with every family he served.</p></div>
            <div><h3>The second generation</h3><p>Vishal Narang has spent his life with rice, and knows each variety by its origin, age, aroma and grain. Mohit Narang, an IT professional, keeps the business ready for what comes next.</p></div>
            <div><h3>Why we do it</h3><p>India has hundreds of rice varieties, and many are disappearing. We find them, keep them, and bring them to your table.</p></div>
          </div>
          <dl className="nums rise">{numbers.map(n => <div key={n.small}><dt>{n.small}</dt><dd>{n.big}</dd></div>)}</dl>
        </div>
      </section>

      <section className="sec" data-bg={colour.sand} data-dark="0">
        <div className="kala rise">
          <div className="kala-pic"><img src="/rice/kalanamak-rice/bowl.webp" srcSet="/rice/kalanamak-rice/bowl-360.webp 360w, /rice/kalanamak-rice/bowl.webp 720w" sizes="(max-width: 820px) 80vw, 480px" alt="Kala Namak rice in a brass bowl" width={720} height={720} loading="lazy" /></div>
          <div className="kala-txt">
            <h2>Kala Namak, and the hands that grow it</h2>
            <p>Our flagship rice is a heritage variety from the Terai belt of Uttar Pradesh. Ram Chet Chaudhary&rsquo;s family has grown it for generations, the traditional way.</p>
            <blockquote>&ldquo;As long as I am here, I will support you.&rdquo;<cite>Ram Chet Chaudhary, farmer</cite></blockquote>
            <Link className="btn" href="/rice/kalanamak-rice">See Kala Namak</Link>
          </div>
        </div>
      </section>

      <div data-bg={colour.cream} data-dark="0"><Catalogue products={products} families={families.map(f => f.name)} /></div>

      <Featured products={featured} />

      <section className="sec" id="questions" data-bg={colour.sand} data-dark="0">
        <div className="faq">
          <h2>Common questions</h2>
          <div>{questions.map(x => <details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div>
        </div>
      </section>
    </div>
  );
}
