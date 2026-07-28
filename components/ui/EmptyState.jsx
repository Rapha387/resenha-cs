import { cx } from '@/lib/cx';

export default function EmptyState({ icone = null, titulo, children, className = '' }) {
  return (
    <div className={cx('vazio', className)}>
      {icone ? <div className="vazio-icone" aria-hidden="true">{icone}</div> : null}
      {titulo ? <div className="vazio-titulo">{titulo}</div> : null}
      {children ? <p className="fraco">{children}</p> : null}
    </div>
  );
}
