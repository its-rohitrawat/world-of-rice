import Home from '@/components/Home';
import { getFamilies, getProduct, getProducts, type Product } from '@/lib/products';

const FEATURED = ['kali-mooch', 'double-chabi-golden-sella-basmati', 'south-sona-mansoori-rice', 'black-rice', 'naira-zeeba-golden-sella-mongra'];
export default function Page() {
  const products = getProducts();
  const families = getFamilies();
  const featured = FEATURED.map(getProduct).filter((p): p is Product => Boolean(p));
  return <Home products={products} featured={featured} families={families} />;
}
