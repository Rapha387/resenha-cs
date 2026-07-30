import Button from '@/components/ui/Button';

// Instalador servido como arquivo estático do próprio site (public/client/).
// Link direto: nada de rota de API no meio, o Next entrega o .exe sozinho.
export const CLIENT_INSTALADOR = '/client/ResenhaClient-setup.exe';

// Aparece pra quem ainda não conectou o app. Sem o client, o placar da galera
// não é registrado — então o download é o caminho principal da home.
export default function ClientDownload({ compacto = false }) {
  return (
    <div className={compacto ? 'mt-sm' : 'mt'}>
      <Button variante="ct" tamanho={compacto ? 'sm' : undefined} href={CLIENT_INSTALADOR} download>
        ⬇ Baixar Resenha Client
      </Button>
      {compacto ? null : (
        <p className="fraco mt-sm">
          App de Windows que lê o placar direto do CS2 — sem ele a partida não é
          registrada. Instale, gere o código de conexão no seu perfil e pronto.
        </p>
      )}
    </div>
  );
}
