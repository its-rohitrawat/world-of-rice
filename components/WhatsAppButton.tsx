import { WhatsAppIcon } from './Icons';
import { whatsappLink } from '@/lib/site';

/** Links to WhatsApp using the number in lib/site.ts. */
export default function WhatsAppButton({ product }: { product?: string }) {
  const href = whatsappLink(product);
  return href ? <a className="btn btn-wa" href={href} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /><span>Ask on WhatsApp</span></a> : null;
}

/** The round button that stays in the bottom right corner of every page. */
export function WhatsAppFab() {
  const href = whatsappLink();
  return href ? <a className="fab" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"><WhatsAppIcon /><span aria-hidden="true">Chat with us</span></a> : null;
}
