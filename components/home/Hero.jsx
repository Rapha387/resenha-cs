export default function Hero({ children }) {
  return (
    <section className="hero">
      <div className="hero-kicker">5v5 · steam · leetify · elo interno</div>
      <h1>
        <span className="tr">Monta</span> o time.<br />
        <span className="ct">Bane</span> o mapa.<br />
        Resolve no servidor.
      </h1>
      <p className="sub">
        Login com a Steam, stats puxados da Leetify, veto de mapas ao vivo e
        ranking interno da resenha. Sem desculpa pra time desequilibrado.
      </p>
      {children ? <div className="acoes">{children}</div> : null}
    </section>
  );
}
