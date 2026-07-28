import './globals.css';

export const metadata = {
  title: 'Resenha CS — 5x5 entre amigos',
  description: 'Login Steam, stats da Leetify, veto de mapas ao vivo e ranking interno da resenha.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#10151c',
  colorScheme: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
