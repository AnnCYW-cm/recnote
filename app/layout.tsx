import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lujian-video-guide-demo.caiyiwenann.chatgpt.site'),
  title: '录见 · AI 录屏教程生成器',
  description: '上传一段操作录屏，自动生成可编辑、可发布的图文教程。',
  openGraph: {
    title: '录见 · AI 录屏教程生成器',
    description: '录一遍，教程自己长出来。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '录见：录一遍，教程自己长出来' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '录见 · AI 录屏教程生成器',
    description: '录一遍，教程自己长出来。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
