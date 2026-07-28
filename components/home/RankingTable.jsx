import Avatar from '@/components/ui/Avatar';
import { cx } from '@/lib/cx';
import { inteiro } from '@/lib/format';

// `eu` destaca a linha do jogador logado
export default function RankingTable({ ranking, eu = null }) {
  return (
    <div className="ranking-scroll">
      <table className="ranking">
        <thead>
          <tr>
            <th className="pos">#</th>
            <th>Jogador</th>
            <th className="num">Elo</th>
            <th className="num">V</th>
            <th className="num">D</th>
            <th className="num">Premier</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((p, i) => (
            <tr
              key={p.steamid}
              className={cx(i < 3 && `top-${i + 1}`, p.steamid === eu && 'eu')}
            >
              <td className="pos">{i + 1}</td>
              <td>
                <div className="jog">
                  <Avatar src={p.avatar} nome={p.name} tamanho="sm" />
                  <span className="jog-nome">{p.name || p.steamid}</span>
                  {p.steamid === eu ? <span className="jog-eu">você</span> : null}
                </div>
              </td>
              <td className="num forte">{inteiro(p.elo) ?? '—'}</td>
              <td className="num">{p.wins ?? 0}</td>
              <td className="num">{p.losses ?? 0}</td>
              <td className="num">{inteiro(p.premier) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
