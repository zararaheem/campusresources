import './globals.css';

export const metadata = {
  title: 'Alpha Campus Handbook',
  description: 'The living Alpha campus handbook — one aligned handbook, a live edition per location.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
