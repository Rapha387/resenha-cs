import { cx } from '@/lib/cx';

export default function Loading({ children = 'Carregando', className = '' }) {
  return (
    <p className={cx('carregando', className)} role="status">
      {children}
      <span className="pontos" aria-hidden="true" />
    </p>
  );
}
