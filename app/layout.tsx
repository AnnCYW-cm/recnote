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
  metadataBase: new URL(
    'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site',
  ),
  title: '录见 V0.1 · 候选画面提取与教程工作台原型',
  description:
    '录见 V0.1：真实候选帧提取 POC，加上使用自有预置案例的教程编辑、人工复核与导出演示；语义转换尚未接入。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '录见 V0.1 · 从录屏候选画面到可编辑教程',
    description:
      '真实 CLI 提取 7 张候选画面，Web 使用 6 步自有预置初稿演示编辑、复核与导出。',
    url: '/',
    type: 'website',
    siteName: '录见 Demo',
    locale: 'zh_CN',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: '录见 V0.1：从录屏候选画面到可编辑教程',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '录见 V0.1 · 从录屏候选画面到可编辑教程',
    description:
      '真实 CLI 提取 7 张候选画面，Web 使用 6 步自有预置初稿演示编辑、复核与导出。',
    images: ['/og.jpg'],
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
