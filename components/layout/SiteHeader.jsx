import Logo from './Logo';

export default function SiteHeader({ direita = null }) {
  return (
    <header>
      <div className="wrap">
        <Logo />
        {direita}
      </div>
    </header>
  );
}
