import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductView from '@/components/ProductView';
import { getProduct, getProducts, type Product } from '@/lib/products';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => getProducts().map(p => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.name, description: p.line } : {};
}

export default async function Page({ params }: Props) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const all = getProducts();
  const shared = (o: Product) => o.families.filter(f => p.families.includes(f)).length;
  const related = all.filter(o => o.slug !== p.slug).sort((a, b) => shared(b) - shared(a)).slice(0, 6);
  return <ProductView key={p.slug} product={p} related={related} next={all[(all.indexOf(p) + 1) % all.length]} total={all.length} />;
}
