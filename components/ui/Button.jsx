import Link from 'next/link';
import { cx } from '@/lib/cx';

const VARIANTES = {
  neutro: null,
  tr: 'btn-tr',
  ct: 'btn-ct',
  steam: 'btn-steam',
  fantasma: 'btn-fantasma',
};

export default function Button({
  variante = 'neutro',
  tamanho,
  href,
  className = '',
  children,
  ...resto
}) {
  const classe = cx('btn', VARIANTES[variante], tamanho === 'sm' && 'btn-sm', className);

  if (href) {
    // rotas de API e links externos precisam de navegação real, não do router do Next
    const externo = /^(https?:|\/api\/|mailto:)/.test(href);
    if (externo) return <a className={classe} href={href} {...resto}>{children}</a>;
    return <Link className={classe} href={href} {...resto}>{children}</Link>;
  }

  return <button className={classe} type="button" {...resto}>{children}</button>;
}
