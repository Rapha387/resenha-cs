import { cx } from '@/lib/cx';

// tom: erro | aviso
export default function Alert({ tom = 'erro', className = '', children }) {
  if (!children) return null;
  return (
    <div
      className={cx('alerta', `alerta-${tom}`, className)}
      role={tom === 'erro' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
