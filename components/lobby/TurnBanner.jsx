import Avatar from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';

export default function TurnBanner({ jogador, vezDoA, minhaVez, children }) {
  return (
    <div className={cx('turno', vezDoA ? 'vez-a' : 'vez-b', minhaVez && 'sua-vez')} role="status">
      {jogador ? <Avatar src={jogador.avatar} nome={jogador.name} tamanho="md" /> : null}
      <span>{children}</span>
    </div>
  );
}
