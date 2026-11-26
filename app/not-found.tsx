import Link from 'next/link';

export default function NotFound() {
  return <div className="nf"><h1>We could not find that rice.</h1><Link className="txt-link" href="/#catalogue">See all varieties</Link></div>;
}
