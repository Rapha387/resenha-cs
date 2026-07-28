import { cx } from '@/lib/cx';
import { inteiro, numero, porcentagem } from '@/lib/format';

// Grade de números do jogador. O que a Leetify não devolveu simplesmente não aparece.
export default function PlayerStats({ player, className = '' }) {
  const itens = [
    { rotulo: 'Elo', valor: inteiro(player.elo ?? 1000) },
    { rotulo: 'Vitórias', valor: inteiro(player.wins ?? 0), tom: 'ok' },
    { rotulo: 'Derrotas', valor: inteiro(player.losses ?? 0), tom: 'ban' },
    { rotulo: 'Premier', valor: inteiro(player.premier), tom: 'ct' },
    { rotulo: 'Leetify', valor: numero(player.leetify_rating, 1), tom: 'tr' },
    { rotulo: 'Aim', valor: numero(player.aim, 1) },
    { rotulo: 'Utility', valor: numero(player.utility, 1) },
    { rotulo: 'HS', valor: porcentagem(player.hs_pct) },
  ].filter(i => i.valor !== null);

  if (itens.length === 0) return null;

  return (
    <dl className={cx('stats', className)}>
      {itens.map(({ rotulo, valor, tom }) => (
        <div className={cx('stat', tom && `stat-${tom}`)} key={rotulo}>
          <dt>{rotulo}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
    </dl>
  );
}
