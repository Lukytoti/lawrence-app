import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lawrence Operating System',
  description: 'Private Executive Business Productivity & Leadership Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-root text-txt-primary antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
