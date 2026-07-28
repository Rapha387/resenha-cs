import { cx } from '@/lib/cx';

// tom: neutro | premier | rating | capitao | dono | ok | ban
export default function Tag({ tom = 'neutro', className = '', children }) {
  return <span className={cx('tag', tom !== 'neutro' && `tag-${tom}`, className)}>{children}</span>;
}
