import { cx } from '@/lib/cx';

// `aside` vira um contador/ação à direita do título (ex.: "4/10")
export default function SectionTitle({ children, aside = null, className = '' }) {
  const titulo = <h2 className="secao">{children}</h2>;
  if (!aside) return <div className={cx('secao-topo', className)}>{titulo}</div>;
  return (
    <div className={cx('secao-topo', className)}>
      {titulo}
      <span className="secao-aside">{aside}</span>
    </div>
  );
}
