import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

// Casca comum das páginas: header fixo, conteúdo centralizado e rodapé.
export default function PageShell({ direita = null, rodape = null, children }) {
  return (
    <>
      <SiteHeader direita={direita} />
      <main className="wrap">{children}</main>
      <SiteFooter>{rodape}</SiteFooter>
    </>
  );
}
