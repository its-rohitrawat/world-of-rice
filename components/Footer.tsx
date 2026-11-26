import { PhoneIcon } from './Icons';
import WhatsAppButton from './WhatsAppButton';
import { mapLink, site, telLink } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="foot" id="visit">
      <div className="foot-in">
        <div className="foot-lead">
          <h2>Come and see the grain.</h2>
          <p>Our Gurugram store keeps over 150 varieties under one roof.</p>
          <div className="btns">
            <a className="btn" href={telLink}><PhoneIcon /><span>Call {site.phone}</span></a>
            <WhatsAppButton />
          </div>
        </div>
        <div className="foot-cols">
          {site.stores.map(s => (
            <address key={s.place}>
              <h3>{s.place}</h3>{s.lines.map(l => <span key={l}>{l}</span>)}
              <a href={mapLink(s.lines)} target="_blank" rel="noopener noreferrer">Open in Maps</a>
            </address>
          ))}
          <address><h3>Hours</h3><span>{site.hours}</span></address>
        </div>
      </div>
      <div className="foot-end"><img src="/logo.webp" alt="" width={120} height={123} loading="lazy" /><span>{site.name}</span></div>
    </footer>
  );
}
