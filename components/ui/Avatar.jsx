import { cx } from '@/lib/cx';
import { primeiraLetra } from '@/lib/format';

// tamanhos: sm (24) | md (28) | lg (40) | xl (64)
export default function Avatar({ src, nome, tamanho = 'lg', className = '' }) {
  const base = cx('avatar', `avatar-${tamanho}`, className);
  if (src) return <img className={base} src={src} alt="" loading="lazy" />;
  return (
    <div className={cx(base, 'avatar-vazio')} aria-hidden="true">
      {primeiraLetra(nome)}
    </div>
  );
}
