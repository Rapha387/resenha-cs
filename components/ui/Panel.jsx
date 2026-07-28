import { cx } from '@/lib/cx';

export default function Panel({ className = '', children, ...resto }) {
  return <div className={cx('painel', className)} {...resto}>{children}</div>;
}
