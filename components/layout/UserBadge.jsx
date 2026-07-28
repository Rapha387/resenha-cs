'use client';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

export default function UserBadge({ user, onSair }) {
  if (!user) return null;
  return (
    <div className="header-user">
      <Avatar src={user.avatar} nome={user.name} tamanho="md" />
      <span className="header-user-nome">{user.name}</span>
      <Button tamanho="sm" variante="fantasma" onClick={onSair}>Sair</Button>
    </div>
  );
}
