import Link from 'next/link';
import type { CSSProperties } from 'react';
import { tileFor } from '@/lib/palette';
import { BLANK, CARD_SIZES, grainSet, grainSrc, packSet, packSrc, type Product } from '@/lib/products';

/** Pack first on its family-colour square; the rice in its bowl appears on hover or keyboard focus. */
export default function RiceCard({ product: p, hidden }: { product: Product; hidden?: boolean }) {
  const t = tileFor(p.families);
  return (
    <Link className="card" data-flip-id={p.slug} href={`/rice/${p.slug}`} prefetch={false} style={hidden ? { display: 'none' } : undefined}>
      <span className="card-pic" style={{ '--c1': t.from, '--c2': t.to } as CSSProperties}>
        <img className="p" src={packSrc(p)} srcSet={packSet(p)} sizes={CARD_SIZES} alt="" loading="lazy" decoding="async" />
        {/* the bowl only shows on hover, so touch screens never download it */}
        {p.hasGrain && <picture><source media="(hover: none)" srcSet={BLANK} /><img className="g" src={grainSrc(p)} srcSet={grainSet(p)} sizes={CARD_SIZES} alt="" loading="lazy" decoding="async" /></picture>}
      </span>
      <span className="card-name">{p.name}</span>
      {p.families[0] && <span className="card-fam">{p.families[0]}</span>}
    </Link>
  );
}
