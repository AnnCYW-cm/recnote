import type { Metadata } from 'next';
import Image from 'next/image';
import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Code2,
  FileArchive,
  FileJson,
  Images,
  Laptop,
  LockKeyhole,
  Play,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: '录见文章配图 · 木瓦任务板',
  robots: {
    index: false,
    follow: false,
  },
};

const layerCards = [
  {
    eyebrow: 'MEDIA',
    title: '媒体处理层',
    copy: '读取视频、发现变化、提取候选截图',
    status: '本地 POC 已完成',
    icon: ScanSearch,
    tone: 'green',
  },
  {
    eyebrow: 'SEMANTIC',
    title: '语义理解层',
    copy: '判断动作、合并步骤、生成标题与说明',
    status: 'V0.1 尚未接入',
    icon: WandSparkles,
    tone: 'pending',
  },
  {
    eyebrow: 'DELIVERY',
    title: '教程交付层',
    copy: '编辑、复核、隐私检查与文件导出',
    status: 'Web Demo 已完成',
    icon: FileArchive,
    tone: 'violet',
  },
] as const;

function Brand({ index }: { index: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-[13px] bg-gradient-to-br from-[#8b6cff] via-[#7657ff] to-[#4fdcff] text-white shadow-[0_12px_32px_rgba(118,87,255,.24)]">
          <Play className="size-4 fill-current" />
        </span>
        <div>
          <p className="text-[15px] font-semibold tracking-[-0.02em] text-[#17191d]">
            录见 · RECNOTE
          </p>
          <p className="mt-0.5 text-[11px] tracking-[0.16em] text-[#8b8e96]">
            PRODUCT NOTE / V0.1
          </p>
        </div>
      </div>
      <span className="font-mono text-[13px] tracking-[0.16em] text-[#8d9098]">
        {index} / 09
      </span>
    </div>
  );
}

function TitleBlock({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="mt-16">
      <p className="text-[13px] font-semibold tracking-[0.16em] text-[#6857e8] uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-4 max-w-[936px] text-balance text-[50px] leading-[1.1] font-semibold tracking-[-0.052em] text-[#17191d]">
        {title}
      </h1>
      <p className="mt-5 max-w-[936px] text-[25px] leading-[1.62] tracking-[-0.015em] text-[#6f737c]">
        {copy}
      </p>
    </div>
  );
}

function TrafficLights() {
  return (
    <div className="flex items-center gap-2">
      <span className="size-3 rounded-full bg-[#ff6258]" />
      <span className="size-3 rounded-full bg-[#ffbd2e]" />
      <span className="size-3 rounded-full bg-[#28c941]" />
    </div>
  );
}

function MacWindow({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[24px] border border-black/[0.08] bg-white shadow-[0_24px_70px_rgba(31,35,42,.13)] ${className}`}
    >
      <div className="relative flex h-14 items-center border-b border-black/[0.07] bg-[#f7f7f8] px-5">
        <TrafficLights />
        <p className="absolute inset-x-0 text-center text-[13px] font-medium text-[#62666d]">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function Canvas({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      className="article-asset relative h-[1350px] w-[1080px] flex-col overflow-hidden bg-[#f1f2f4] p-[72px]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 8%, rgba(255,255,255,.98), transparent 28%), radial-gradient(circle at 92% 92%, rgba(105,87,232,.08), transparent 34%), linear-gradient(145deg,#f7f8f9 0%,#eef0f2 48%,#f3f1f5 100%)',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif',
      }}
    >
      {children}
    </section>
  );
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'violet' | 'amber';
}) {
  const toneClass = {
    neutral: 'border-black/[0.07] bg-white/75 text-[#666b73]',
    green: 'border-[#4f755f]/15 bg-[#4f755f]/10 text-[#41634f]',
    violet: 'border-[#6f5ae8]/15 bg-[#6f5ae8]/10 text-[#5d48da]',
    amber: 'border-[#b98227]/15 bg-[#b98227]/10 text-[#9b6a1d]',
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
}

function Connector({ dashed = false }: { dashed?: boolean }) {
  return (
    <div className="flex w-10 shrink-0 items-center">
      <span
        className={`h-px flex-1 ${dashed ? 'border-t border-dashed border-[#a6a9b1]' : 'bg-[#b8bbc2]'}`}
      />
      <ArrowRight className="size-4 -translate-x-0.5 text-[#999da5]" />
    </div>
  );
}

export default function ArticleAssetsPage() {
  return (
    <main className="min-h-screen w-[1080px] bg-[#111318]">
      <style>
        {
          '.article-asset{display:none}.article-asset:first-of-type{display:flex}body:has(.article-asset:target) .article-asset:first-of-type:not(:target){display:none}.article-asset:target{display:flex}'
        }
      </style>

      <Canvas id="asset-1">
        <Brand index="01" />
        <TitleBlock
          eyebrow="WHAT EXISTS TODAY"
          title="两端都能跑，但还没有自动接通"
          copy="CLI 真实提取 7 张候选画面；Web 使用 6 步自有预置初稿演示编辑、复核与导出。"
        />
        <div className="mt-10 grid flex-1 grid-rows-[1fr_auto_1fr] gap-4">
          <MacWindow title="候选帧 CLI · 真实本地运行">
            <div className="grid h-[360px] grid-cols-[1.1fr_.9fr] gap-5 p-5">
              <div className="overflow-hidden rounded-[14px] border border-black/[0.06] bg-[#eceef1]">
                <Image
                  src="/article/cli-contact-sheet.jpg"
                  alt="候选帧联系表"
                  width={1000}
                  height={1340}
                  unoptimized
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="flex flex-col rounded-[14px] bg-[#181b20] p-5 font-mono text-[13px] leading-7 text-[#cfd5dc]">
                <span className="text-[#7de1bd]">$ video_guide.py</span>
                <span>[1/6] 读取元数据</span>
                <span>[2/6] 分析场景变化</span>
                <span>[4/6] 抽取 7 张截图</span>
                <span>[6/6] 完成</span>
                <span className="mt-auto text-[#89919b]">
                  OFFLINE · NO MODEL API
                </span>
              </div>
            </div>
          </MacWindow>
          <div className="flex items-center gap-4 px-3">
            <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
            <Pill tone="amber">两部分独立运行 · 尚未打通</Pill>
            <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
          </div>
          <MacWindow title="录见 Web 工作台 · 预设初稿">
            <div className="h-[320px] overflow-hidden bg-[#0b0d12]">
              <Image
                src="/article/web-editor.jpg"
                alt="录见教程编辑器"
                width={1440}
                height={900}
                unoptimized
                className="h-full w-full object-cover object-top"
              />
            </div>
          </MacWindow>
        </div>
      </Canvas>

      <Canvas id="asset-2">
        <Brand index="02" />
        <TitleBlock
          eyebrow="ARCHITECTURE"
          title="三层架构，只把已经完成的画实线"
          copy="真正缺的不是再加一个页面，而是把候选画面可靠地转成可编辑步骤。"
        />
        <div className="mt-16 space-y-7">
          {layerCards.map((item, index) => {
            const Icon = item.icon;
            const pending = item.tone === 'pending';
            const tone =
              item.tone === 'green'
                ? 'bg-[#4f755f] text-white'
                : item.tone === 'violet'
                  ? 'bg-[#6d5ae6] text-white'
                  : 'border-2 border-dashed border-[#afb2b9] bg-white/45 text-[#7a7e86]';
            return (
              <div key={item.title}>
                <div
                  className={`grid min-h-[190px] grid-cols-[76px_1fr_auto] items-center gap-7 rounded-[28px] border border-white/70 p-8 shadow-[0_20px_55px_rgba(30,34,40,.08)] ${pending ? 'border-dashed border-[#b8bbc2] bg-white/35' : 'bg-white/82'}`}
                >
                  <span
                    className={`grid size-[72px] place-items-center rounded-[20px] ${tone}`}
                  >
                    <Icon className="size-8" />
                  </span>
                  <div>
                    <p className="text-[12px] font-semibold tracking-[0.16em] text-[#8b8f96]">
                      {item.eyebrow}
                    </p>
                    <h2 className="mt-2 text-[29px] font-semibold tracking-[-0.035em] text-[#202228]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-[17px] leading-7 text-[#737780]">
                      {item.copy}
                    </p>
                  </div>
                  <Pill
                    tone={
                      item.tone === 'green'
                        ? 'green'
                        : item.tone === 'violet'
                          ? 'violet'
                          : 'amber'
                    }
                  >
                    {item.status}
                  </Pill>
                </div>
                {index < layerCards.length - 1 && (
                  <div className="mx-auto h-7 w-px border-l border-dashed border-[#aaaeb6]" />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-auto flex items-center gap-4 rounded-[20px] border border-black/[0.06] bg-white/65 px-6 py-5 text-[15px] leading-7 text-[#6e727a]">
          <ShieldCheck className="size-6 shrink-0 text-[#4f755f]" />
          Web
          当前只校验文件名与类型，不读取视频字节，也不会把用户文件画成“已经被 AI
          分析”。
        </div>
      </Canvas>

      <Canvas id="asset-3">
        <Brand index="03" />
        <TitleBlock
          eyebrow="TWO REAL FLOWS"
          title="两条流程已经跑通，中间还缺语义层"
          copy="上面是真实读取视频的 CLI，下面是使用预设教程数据的 Web 工作台。"
        />
        <div className="mt-16 rounded-[32px] border border-white/75 bg-white/60 p-8 shadow-[0_25px_80px_rgba(33,36,43,.09)]">
          <div className="flex items-center justify-between">
            <div>
              <Pill tone="green">真实读取视频</Pill>
              <h2 className="mt-4 text-[26px] font-semibold text-[#202228]">
                候选帧 CLI
              </h2>
            </div>
            <span className="font-mono text-[12px] text-[#8b8f97]">
              LOCAL / OFFLINE
            </span>
          </div>
          <div className="mt-8 flex items-stretch">
            {[
              '读取元数据',
              '检测变化',
              '合并事件',
              '覆盖补帧',
              '相邻去重',
              '输出评审页',
            ].map((label, index, all) => (
              <div key={label} className="contents">
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[16px] border border-black/[0.06] bg-white px-2 py-5 text-center text-[13px] font-medium text-[#555a62]">
                  <span className="mb-2 font-mono text-[10px] text-[#4f755f]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {label}
                </div>
                {index < all.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </div>

        <div className="my-8 flex items-center gap-5">
          <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
          <div className="flex items-center gap-2 rounded-full border border-dashed border-[#a9acb4] bg-white/55 px-5 py-2 text-[13px] font-medium text-[#7a7e86]">
            <CircleDashed className="size-4" /> 语义转换尚未接入
          </div>
          <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
        </div>

        <div className="rounded-[32px] border border-white/75 bg-white/60 p-8 shadow-[0_25px_80px_rgba(33,36,43,.09)]">
          <div className="flex items-center justify-between">
            <div>
              <Pill tone="violet">使用预设初稿</Pill>
              <h2 className="mt-4 text-[26px] font-semibold text-[#202228]">
                Web 教程工作台
              </h2>
            </div>
            <span className="font-mono text-[12px] text-[#8b8f97]">
              INTERACTIVE DEMO
            </span>
          </div>
          <div className="mt-8 flex items-stretch">
            {[
              '载入初稿',
              '编辑步骤',
              '复核改动',
              '逐图隐私',
              '成稿预览',
              '三种导出',
            ].map((label, index, all) => (
              <div key={label} className="contents">
                <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[16px] border border-black/[0.06] bg-white px-2 py-5 text-center text-[13px] font-medium text-[#555a62]">
                  <span className="mb-2 font-mono text-[10px] text-[#6d5ae6]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {label}
                </div>
                {index < all.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </div>
      </Canvas>

      <Canvas id="asset-4">
        <Brand index="04" />
        <TitleBlock
          eyebrow="LOCAL RUN"
          title="同一段自有录屏，CLI 跑出的真实结果"
          copy="一次本机离线样本：不联网，不调用模型 API，截图默认仍需人工隐私检查。"
        />
        <div className="mt-12 grid grid-cols-4 gap-4">
          {[
            ['17.83s', '录屏时长'],
            ['1440×900', '原始分辨率'],
            ['2.06s', '单次计时'],
            ['7', '候选截图'],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-[22px] border border-white/80 bg-white/78 p-5 shadow-[0_14px_40px_rgba(35,38,45,.07)]"
            >
              <p className="font-mono text-[26px] font-semibold tracking-[-0.04em] text-[#202329]">
                {value}
              </p>
              <p className="mt-2 text-[12px] tracking-[0.1em] text-[#898d95]">
                {label}
              </p>
            </div>
          ))}
        </div>
        <MacWindow title="recording.mp4 · review.html" className="mt-6">
          <div className="grid h-[600px] grid-rows-[1fr_178px]">
            <div className="overflow-hidden bg-[#e8eaed] p-5">
              <Image
                src="/article/cli-contact-sheet.jpg"
                alt="同一次运行生成的候选联系表"
                width={1000}
                height={1340}
                unoptimized
                className="h-full w-full rounded-[14px] object-cover object-top shadow-[0_12px_35px_rgba(30,34,40,.12)]"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-8 bg-[#171a1f] p-6 font-mono text-[13px] leading-7 text-[#cfd5dc]">
              <div>
                <p className="text-[#7de1bd]">[6/6] 完成</p>
                <p>输出：7 张高分辨率截图</p>
                <p>隐私状态：unreviewed</p>
              </div>
              <div className="flex flex-col items-end justify-center gap-2">
                <Pill tone="green">OFFLINE</Pill>
                <Pill tone="neutral">NO MODEL API</Pill>
              </div>
            </div>
          </div>
        </MacWindow>
      </Canvas>

      <Canvas id="asset-5">
        <Brand index="05" />
        <TitleBlock
          eyebrow="THE MISSING BRIDGE"
          title="两端之间，缺的是一层真正的语义转换"
          copy="候选图不等于教程步骤。中间还要完成选择、合并、理解、写作与来源追踪。"
        />
        <div className="mt-20 grid grid-cols-[1fr_190px_1fr] items-stretch gap-6">
          <MacWindow title="candidates.json">
            <div className="h-[620px] bg-[#171a1f] p-7 font-mono text-[14px] leading-7 text-[#cbd1d9]">
              <p className="text-[#8b93a0]">{'{'}</p>
              <p className="pl-5 text-[#7de1bd]">&quot;candidates&quot;: [</p>
              <p className="pl-10">{'{'}</p>
              <p className="pl-14">&quot;id&quot;: &quot;C004&quot;,</p>
              <p className="pl-14">&quot;timestamp&quot;: {'{'}</p>
              <p className="pl-20">&quot;requested_seconds&quot;: 6.75</p>
              <p className="pl-14">{'}'},</p>
              <p className="pl-14">&quot;detection&quot;: {'{'}</p>
              <p className="pl-20">&quot;sources&quot;: [</p>
              <p className="pl-24 text-[#c3a7ff]">&quot;periodic&quot;,</p>
              <p className="pl-24 text-[#c3a7ff]">&quot;scene&quot;</p>
              <p className="pl-20">]</p>
              <p className="pl-14">{'}'},</p>
              <p className="pl-14">&quot;review&quot;: {'{'}</p>
              <p className="pl-20">&quot;status&quot;: &quot;pending&quot;</p>
              <p className="pl-14">{'}'}</p>
              <p className="pl-10">{'}'}</p>
              <p className="pl-5">]</p>
              <p>{'}'}</p>
              <div className="mt-10 flex items-center gap-3 text-[#939ba7]">
                <FileJson className="size-4" /> 候选编号只在单次运行内有效
              </div>
            </div>
          </MacWindow>

          <div className="flex flex-col items-center justify-center">
            <span className="h-20 border-l border-dashed border-[#999da5]" />
            <div className="my-5 grid size-[150px] place-items-center rounded-full border-2 border-dashed border-[#a8abb3] bg-white/55 text-center">
              <div>
                <WandSparkles className="mx-auto size-8 text-[#6d5ae6]" />
                <p className="mt-3 text-[14px] font-semibold text-[#555a62]">
                  语义转换层
                </p>
                <p className="mt-1 text-[11px] text-[#9a6b20]">尚未实现</p>
              </div>
            </div>
            <span className="h-20 border-l border-dashed border-[#999da5]" />
          </div>

          <MacWindow title="TutorialStep[] · Web 预置数据">
            <div className="h-[620px] bg-white p-7">
              <div className="overflow-hidden rounded-[16px] border border-black/[0.07] bg-[#f6f7f8]">
                <Image
                  src="/cases/muwa-board/04-created.jpg"
                  alt="教程步骤截图"
                  width={1440}
                  height={900}
                  unoptimized
                  className="h-[220px] w-full object-cover object-top"
                />
              </div>
              <div className="mt-6 space-y-4 text-[15px] text-[#5f646c]">
                <div className="rounded-[14px] bg-[#f2f3f5] px-4 py-3">
                  <span className="text-[#9498a0]">time</span>
                  <strong className="float-right text-[#24272d]">00:07</strong>
                </div>
                <div className="rounded-[14px] bg-[#f2f3f5] px-4 py-3">
                  <span className="text-[#9498a0]">title</span>
                  <strong className="float-right text-[#24272d]">
                    创建任务并打开详情
                  </strong>
                </div>
                <div className="rounded-[14px] bg-[#f2f3f5] px-4 py-3">
                  <span className="text-[#9498a0]">included</span>
                  <strong className="float-right text-[#4f755f]">true</strong>
                </div>
              </div>
            </div>
          </MacWindow>
        </div>
      </Canvas>

      <Canvas id="asset-6">
        <Brand index="06" />
        <TitleBlock
          eyebrow="ENGINEERING EVIDENCE"
          title="不是概念图：代码、测试和两套独立工程都能运行"
          copy="核心判断可以复核，项目边界也明确写在目录和验证记录里。"
        />
        <div className="mt-12 grid flex-1 grid-rows-[1fr_220px] gap-6">
          <MacWindow title="video_guide.py · adaptive threshold">
            <div className="grid h-[560px] grid-cols-[1.25fr_.75fr]">
              <div className="bg-[#171a1f] p-7 font-mono text-[14px] leading-7 text-[#d2d7de]">
                <p>
                  <span className="text-[#c3a7ff]">baseline</span> =
                  statistics.median(differences)
                </p>
                <p>
                  <span className="text-[#c3a7ff]">spread</span> =
                  statistics.median(
                </p>
                <p className="pl-8">abs(value - baseline)</p>
                <p className="pl-8">for value in differences</p>
                <p>)</p>
                <p>
                  <span className="text-[#7de1bd]">threshold</span> = max(
                </p>
                <p className="pl-8">config.periodic_mad_floor,</p>
                <p className="pl-8">
                  baseline + config.periodic_noise_multiplier * spread,
                </p>
                <p>)</p>
                <p className="mt-8 text-[#89919b]">
                  # 只发现画面变化，不理解操作语义
                </p>
              </div>
              <div className="flex flex-col justify-between bg-[#f7f7f8] p-7">
                <div>
                  <Pill tone="green">18 / 18 PASS</Pill>
                  <h3 className="mt-5 text-[26px] font-semibold tracking-[-0.035em] text-[#23262c]">
                    自动化测试
                  </h3>
                  <p className="mt-4 text-[16px] leading-8 text-[#70747c]">
                    覆盖时间戳解析、事件聚类、覆盖补帧、相邻去重、输出目录保护与
                    ffmpeg 端到端测试。
                  </p>
                </div>
                <CheckCircle2 className="size-14 text-[#4f755f]" />
              </div>
            </div>
          </MacWindow>

          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: '本地 CLI POC',
                copy: 'video_guide.py · tests · 验证记录',
                badge: '暂未公开',
                icon: Code2,
                tone: 'amber' as const,
              },
              {
                title: 'Web Demo',
                copy: 'app/page.tsx · tutorial-export.ts',
                badge: '自有案例已替换',
                icon: Laptop,
                tone: 'green' as const,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex items-center gap-5 rounded-[24px] border border-white/80 bg-white/75 p-6 shadow-[0_14px_40px_rgba(35,38,45,.07)]"
                >
                  <span className="grid size-14 place-items-center rounded-[16px] bg-[#202329] text-white">
                    <Icon className="size-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[20px] font-semibold text-[#24272d]">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-mono text-[12px] leading-5 text-[#8d9199]">
                      {item.copy}
                    </p>
                  </div>
                  <Pill tone={item.tone}>{item.badge}</Pill>
                </div>
              );
            })}
          </div>
        </div>
      </Canvas>

      <Canvas id="asset-7">
        <Brand index="07" />
        <TitleBlock
          eyebrow="WEB DEMO"
          title="文件选择已实现，视频分析尚未接入"
          copy="页面只校验 MOV / MP4 的文件名与类型；之后展示预置自有案例，不读取也不上传视频字节。"
        />
        <div className="mt-14 grid flex-1 grid-rows-3 gap-5">
          {[
            {
              step: '01',
              title: '选择录屏',
              copy: '仅显示文件名与类型',
              badge: 'LOCAL ONLY',
              image: '/article/web-home.jpg',
            },
            {
              step: '02',
              title: '进入模拟处理页',
              copy: '用预置阶段说明未来任务状态',
              badge: 'SIMULATED',
              image: '/article/web-processing.jpg',
            },
            {
              step: '03',
              title: '打开预设教程初稿',
              copy: '从结构化示例开始编辑与复核',
              badge: 'OWNED CASE',
              image: '/article/web-editor.jpg',
            },
          ].map((item) => (
            <MacWindow key={item.step} title={item.title}>
              <div className="grid h-[246px] grid-cols-[330px_1fr]">
                <div className="relative overflow-hidden bg-[#e9eaed]">
                  <Image
                    src={item.image}
                    alt=""
                    width={1440}
                    height={900}
                    unoptimized
                    className="h-full w-full object-cover object-top"
                  />
                  <span className="absolute left-4 top-4 grid size-10 place-items-center rounded-[12px] bg-[#171a1f]/92 font-mono text-[12px] font-semibold text-white">
                    {item.step}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-6 p-8">
                  <div>
                    <h3 className="text-[25px] font-semibold tracking-[-0.035em] text-[#25282e]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[16px] leading-7 text-[#747881]">
                      {item.copy}
                    </p>
                  </div>
                  <Pill tone={item.step === '01' ? 'green' : 'amber'}>
                    {item.badge}
                  </Pill>
                </div>
              </div>
            </MacWindow>
          ))}
        </div>
        <div className="mt-7 flex items-center justify-center gap-3 rounded-[18px] border border-[#b98227]/15 bg-[#fff7e9] px-5 py-4 text-[14px] font-medium text-[#8a611f]">
          <CircleDashed className="size-5" /> 内置案例模拟 · 非模型实测
        </div>
      </Canvas>

      <Canvas id="asset-8">
        <Brand index="08" />
        <TitleBlock
          eyebrow="DELIVERY GATE"
          title="能导出之前，先把人该负责的检查做完"
          copy="文案改动会让复核状态失效；所有成稿截图都必须逐张确认隐私。"
        />
        <div className="mt-14 grid flex-1 grid-cols-[360px_1fr] gap-7">
          <MacWindow title="录见 · 编辑器">
            <div className="h-full min-h-[750px] overflow-hidden bg-[#0b0d12]">
              <Image
                src="/article/web-editor.jpg"
                alt="录见编辑器与发布检查"
                width={1440}
                height={900}
                unoptimized
                className="h-full w-full object-cover object-left"
              />
            </div>
          </MacWindow>
          <div className="grid grid-rows-4 gap-5">
            {[
              {
                n: '01',
                title: '文案修改后待复核',
                copy: '再次编辑会自动撤销原复核状态',
                icon: WandSparkles,
                tone: 'amber' as const,
              },
              {
                n: '02',
                title: '逐张确认截图隐私',
                copy: '人工检查账号、姓名、密钥和路径',
                icon: LockKeyhole,
                tone: 'violet' as const,
              },
              {
                n: '03',
                title: '三种交付方式通过同一道门禁',
                copy: 'Markdown、公众号格式、独立图文包',
                icon: CheckCircle2,
                tone: 'green' as const,
              },
              {
                n: '04',
                title: 'ZIP 离线可用',
                copy: '文稿、HTML、说明与 images/ 一起交付',
                icon: FileArchive,
                tone: 'neutral' as const,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.n}
                  className="grid grid-cols-[54px_58px_1fr] items-center gap-5 rounded-[24px] border border-white/80 bg-white/78 p-6 shadow-[0_14px_40px_rgba(35,38,45,.07)]"
                >
                  <span className="font-mono text-[13px] font-semibold text-[#9498a0]">
                    {item.n}
                  </span>
                  <span className="grid size-14 place-items-center rounded-[16px] bg-[#202329] text-white">
                    <Icon className="size-6" />
                  </span>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-[20px] font-semibold text-[#25282e]">
                        {item.title}
                      </h3>
                      <Pill tone={item.tone}>
                        {item.n === '03' ? 'READY' : 'CHECK'}
                      </Pill>
                    </div>
                    <p className="mt-2 text-[15px] leading-7 text-[#747881]">
                      {item.copy}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Canvas>

      <Canvas id="asset-9">
        <Brand index="09" />
        <TitleBlock
          eyebrow="ROADMAP"
          title="V0.2：把两端真正接起来"
          copy="先证明真实录屏能经过有限修改变成可交付教程，再扩展生产与协作能力。"
        />
        <div className="mt-16 flex flex-1 flex-col gap-8">
          <div className="rounded-[32px] border border-[#6d5ae6]/14 bg-white/78 p-9 shadow-[0_24px_70px_rgba(41,37,75,.09)]">
            <div className="flex items-start justify-between">
              <div>
                <Pill tone="violet">P0 · 当前主线</Pill>
                <h2 className="mt-5 text-[32px] font-semibold tracking-[-0.04em] text-[#23262c]">
                  候选到步骤桥接
                </h2>
              </div>
              <span className="grid size-14 place-items-center rounded-[18px] bg-[#6d5ae6] text-white">
                <Sparkles className="size-6" />
              </span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                '评估规则 / OCR / 多模态方案',
                '写入真实 TutorialStep[]',
                '建立自有录屏人工真值',
                '补齐超时、重试与配额保护',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[16px] border border-black/[0.055] bg-[#f7f7f8] px-5 py-4 text-[15px] font-medium text-[#555a62]"
                >
                  <CircleDashed className="size-4 text-[#6d5ae6]" /> {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5 px-6">
            <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
            <ArrowRight className="size-6 text-[#8f939b]" />
            <span className="h-px flex-1 border-t border-dashed border-[#aeb1b8]" />
          </div>

          <div className="rounded-[32px] border border-black/[0.065] bg-white/52 p-9">
            <div className="flex items-start justify-between">
              <div>
                <Pill tone="neutral">P1 · 之后再做</Pill>
                <h2 className="mt-5 text-[32px] font-semibold tracking-[-0.04em] text-[#555a62]">
                  生产与协作
                </h2>
              </div>
              <span className="grid size-14 place-items-center rounded-[18px] border border-black/[0.07] bg-white text-[#7b7f87]">
                <Images className="size-6" />
              </span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                '截图替换、裁剪、标注与遮挡',
                '教程版本与差异更新',
                '云端项目和团队审核',
                '公众号、知识库与 CMS 直连',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-[16px] border border-black/[0.05] bg-white/70 px-5 py-4 text-[15px] text-[#747881]"
                >
                  <CircleDashed className="size-4 text-[#9a9ea6]" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-4 rounded-[20px] bg-[#202329] px-6 py-5 text-white">
          <ShieldCheck className="size-6 text-[#7de1bd]" />
          <p className="text-[15px] leading-7 text-white/78">
            不填写未经验证的准确率、节省比例或完成日期。
          </p>
        </div>
      </Canvas>
    </main>
  );
}
