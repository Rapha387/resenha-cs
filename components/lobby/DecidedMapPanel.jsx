import Panel from '@/components/ui/Panel';

export default function DecidedMapPanel({ mapaNome, children }) {
  return (
    <Panel className="resultado-mapa mt">
      <div className="rotulo">Mapa decidido</div>
      <div className="nome">{mapaNome}</div>
      <p className="fraco">Criem o lobby no CS2 e joguem — o placar entra sozinho no fim da partida.</p>
      {children}
    </Panel>
  );
}
