import type { Metadata } from 'next';
import Image from 'next/image';
import { Play, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: '录见分享图预览',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OgPreviewPage() {
  return (
    <main
      className="relative grid h-[630px] w-[1200px] grid-cols-[.86fr_1.14fr] items-center overflow-hidden bg-[#080a0f] p-[58px] text-white"
      style={{
        backgroundImage:
          'radial-gradient(circle at 28% 12%, rgba(112,86,255,.28), transparent 34%), radial-gradient(circle at 92% 84%, rgba(84,207,232,.16), transparent 30%), linear-gradient(145deg,#090a10 0%,#0b0c13 48%,#07090d 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif',
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      <section className="relative z-10 pr-10">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-[13px] bg-gradient-to-br from-[#8b6cff] via-[#7657ff] to-[#4fdcff] shadow-[0_12px_35px_rgba(118,87,255,.35)]">
            <Play className="size-4 fill-current" />
          </span>
          <div>
            <p className="text-[21px] font-semibold tracking-[-0.04em]">录见</p>
            <p className="mt-0.5 text-[9px] tracking-[0.22em] text-white/45">
              RECNOTE
            </p>
          </div>
        </div>
        <p className="mt-14 text-[12px] font-medium tracking-[0.18em] text-[#9b8cff] uppercase">
          Screen-to-Guide · Concept
        </p>
        <h1 className="mt-4 text-[51px] leading-[1.03] font-semibold tracking-[-0.065em]">
          从录屏的候选画面
          <br />
          到可编辑教程
        </h1>
        <p className="mt-6 max-w-[430px] text-[17px] leading-8 text-white/58">
          两端独立运行 · 语义转换尚未接入
        </p>
        <div className="mt-9 flex items-center gap-3 text-[12px] text-white/56">
          <span>CLI · 7 个候选帧</span>
          <span className="text-[#826cff]">/</span>
          <span className="text-white/82">WEB · 6 步预置稿</span>
        </div>
      </section>

      <section className="relative z-10">
        <div className="absolute inset-12 -z-10 rounded-full bg-[#7657ff]/30 blur-[90px]" />
        <div className="overflow-hidden rounded-[25px] border border-white/[0.14] bg-[#11131a]/92 p-2.5 shadow-[0_38px_100px_rgba(0,0,0,.55)]">
          <div className="relative flex h-11 items-center px-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#ff6258]" />
              <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="size-2.5 rounded-full bg-[#28c941]" />
            </div>
            <span className="absolute inset-x-0 text-center text-[10px] tracking-[0.16em] text-white/42">
              OWNED CASE · DRAFT 01
            </span>
          </div>
          <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-white">
            <Image
              src="/cases/muwa-board/04-created.jpg"
              alt="木瓦任务板自有案例"
              width={1440}
              height={900}
              preload
              unoptimized
              className="aspect-[16/10] w-full object-cover object-top"
            />
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/92 px-3 py-1.5 text-[10px] font-medium text-[#425348] shadow-lg backdrop-blur-xl">
              <Sparkles className="size-3 text-[#4f755f]" /> 自有演示数据
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
