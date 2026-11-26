// The only place the site reads products from. To move the catalogue to Webflow CMS later,
// change getProducts() here and nothing else.
import data from '@/data/products.json';

export type Product = {
  slug: string;
  name: string;
  families: string[];
  sizes: string[];
  line: string;
  about: string[];
  hasGrain: boolean;
  photos: { src: string; type: string }[];
  facts?: { grain: string; cooks: string; knownFor: string };
};

export function getProducts(): Product[] {
  return data as Product[];
}

export function getProduct(slug: string) {
  return getProducts().find(p => p.slug === slug);
}

export function getFamilies() {
  const count = new Map<string, number>();
  for (const p of getProducts()) for (const f of p.families) count.set(f, (count.get(f) ?? 0) + 1);
  return [...count].map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
}

/** The rice in a brass bowl, like the family cards. Products with no grain photo show their pack. */
export const grainSrc = (p: { slug: string; hasGrain: boolean }) => `/rice/${p.slug}/${p.hasGrain ? 'bowl' : 'pack'}.webp`;
export const packSrc = (p: { slug: string }) => `/rice/${p.slug}/pack.webp`;

// Each picture also has a small copy (name-360.webp and so on); the browser takes the one the screen needs.
const small = (src: string, tag: string) => src.replace(/\.webp$/, `-${tag}.webp`);
export const grainSet = (p: { slug: string; hasGrain: boolean }) =>
  p.hasGrain ? `${small(grainSrc(p), '360')} 360w, ${grainSrc(p)} 720w` : packSet(p);
export const packSet = (p: { slug: string }) => `${small(packSrc(p), '300')} 300w, ${small(packSrc(p), '420')} 420w, ${packSrc(p)} 610w`;
export const photoSet = (src: string) => `${small(src, '600')} 600w, ${src} 1100w`;
/** A see-through dot: what touch screens get instead of the hover-only bowl. */
export const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
/** How wide a product card shows on each screen. */
export const CARD_SIZES = '(max-width: 559px) 46vw, (max-width: 820px) 31vw, (max-width: 1320px) 23vw, 270px';
