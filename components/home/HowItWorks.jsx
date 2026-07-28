import Panel from '@/components/ui/Panel';

const PASSOS = [
  'Crie um lobby e mande o código no grupo.',
  'Todo mundo entra com a Steam.',
  'Times por draft de capitães ou balanceados no automático.',
  'Capitães fazem o veto de mapas ao vivo.',
  'Jogou? Registra o placar e sobe (ou desce) no ranking.',
];

export default function HowItWorks() {
  return (
    <Panel>
      <ol className="passos">
        {PASSOS.map((passo, i) => (
          <li key={i}><span className="passo-num">{i + 1}</span>{passo}</li>
        ))}
      </ol>
    </Panel>
  );
}
