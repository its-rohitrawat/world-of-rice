'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PhoneIcon } from './Icons';
import { site, telLink } from '@/lib/site';

const LINKS = [
  ['/#families', 'Rice families'],
  ['/#catalogue', 'All rice'],
  ['/#story', 'Our story'],
  ['/#questions', 'Questions'],
  ['/#visit', 'Visit us'],
] as const;

export default function Header() {
  const [open, setOpen] = useState(false);
  const [small, setSmall] = useState(false);

  // slimmer bar once the page is scrolled; a gap between the two points so it never flickers
  useEffect(() => {
    let raf = 0;
    const check = () => { raf = 0; setSmall(s => (s ? scrollY > 20 : scrollY > 60)); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <>
      <header className={small ? 'head small' : 'head'}>
        <Link href="/" className="head-logo" aria-label="Joy World of Rice, home" onClick={() => setOpen(false)}>
          <img src="/logo.webp" alt="" width={66} height={68} />
          <span>Joy World of Rice</span>
        </Link>
        <nav className="head-nav" aria-label="Main">{LINKS.map(([h, t]) => <Link key={h} href={h}>{t}</Link>)}</nav>
        <a className="head-tel" href={telLink} aria-label={`Call ${site.phone}`}><PhoneIcon /><span>{site.phone}</span></a>
        <button className="head-menu" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
      </header>
      <div className={open ? 'menu open' : 'menu'} id="menu">
        <nav aria-label="Menu">{LINKS.map(([h, t]) => <Link key={h} href={h} onClick={() => setOpen(false)}>{t}</Link>)}</nav>
        <a className="btn" href={telLink}><PhoneIcon /><span>Call {site.phone}</span></a>
      </div>
    </>
  );
}
