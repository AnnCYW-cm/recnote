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
  title: '录见 RecNote · 在浏览器本地把录屏变成图文教程',
  description:
    '录见是一个开源的录屏转图文教程 Web 工具：视频在浏览器本地完成采样、候选画面提取、编辑、隐私复核和图文包导出。',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '录见 RecNote · 从录屏到可编辑图文教程',
    description:
      '视频不离开设备：在浏览器本地提取关键画面，编辑、复核并导出完整图文包。',
    url: '/',
    type: 'website',
    siteName: '录见 RecNote',
    locale: 'zh_CN',
    images: [
      {
        url: '/og-v2.png',
        width: 1200,
        height: 630,
        alt: '录见 RecNote：从录屏到可编辑图文教程',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '录见 RecNote · 从录屏到可编辑图文教程',
    description:
      '视频不离开设备：在浏览器本地提取关键画面，编辑、复核并导出完整图文包。',
    images: ['/og-v2.png'],
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
