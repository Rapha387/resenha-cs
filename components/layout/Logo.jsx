import Link from 'next/link';

export default function Logo() {
  return (
    <Link className="logo" href="/">
      Resenha<span className="barra">{'//'}</span><span className="cs">CS</span>
    </Link>
  );
}
