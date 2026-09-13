export type TutorialExportStep = {
  id: number;
  time: string;
  title: string;
  body: string;
  image: string;
  included: boolean;
};

export type TutorialExportInput = {
  title: string;
  summary: string;
  steps: TutorialExportStep[];
};

type ImagePathResolver = (step: TutorialExportStep, index: number) => string;

const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

function includedSteps(input: TutorialExportInput) {
  return input.steps.filter((step) => step.included);
}

function singleLine(input: string) {
  return input
    .replace(/\s*\r?\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function escapeMarkdownSyntax(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/([`*_[\]<>|~])/g, '\\$1');
}

function escapeMarkdownInline(input: string) {
  return escapeMarkdownSyntax(singleLine(input));
}

function escapeMarkdownBlock(input: string) {
  return input
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => escapeMarkdownSyntax(line))
    .map((line) =>
      line.replace(
        /^(\s*)(#{1,6}(?=\s|$)|[-=]+\s*$|[-+](?=\s)|\d+[.)](?=\s))/,
        '$1\\$2',
      ),
    )
    .join('\n')
    .trim();
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function htmlParagraphs(input: string) {
  return input
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 18px;color:#343844;font-size:16px;line-height:1.9;">${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`,
    )
    .join('');
}

function stepAssetName(index: number, source: string) {
  const extension =
    source.match(/\.(png|jpe?g|webp)$/i)?.[1]?.toLowerCase() ?? 'jpg';
  return `images/step-${String(index + 1).padStart(2, '0')}.${extension === 'jpeg' ? 'jpg' : extension}`;
}

export function safeBasename(input: string) {
  const normalized = singleLine(input).normalize('NFKC');
  let value = Array.from(normalized)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim();
  value = Array.from(value).slice(0, 60).join('');
  if (!value || WINDOWS_RESERVED_NAME.test(value)) value = '录见-教程草稿';
  return value;
}

export function buildMarkdown(
  input: TutorialExportInput,
  imagePath: ImagePathResolver = (step) => step.image,
) {
  const summary = input.summary
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => `> ${escapeMarkdownBlock(line)}`)
    .join('\n');
  const body = includedSteps(input)
    .map((step, index) => {
      const title = escapeMarkdownInline(step.title);
      const alt = escapeMarkdownInline(step.title);
      return `## ${index + 1}. ${title}\n\n**视频时间：${escapeMarkdownInline(step.time)}**\n\n${escapeMarkdownBlock(step.body)}\n\n![${alt}](${imagePath(step, index)})`;
    })
    .join('\n\n');
  return `# ${escapeMarkdownInline(input.title)}\n\n${summary}\n\n${body}\n\n---\n\n*非 OpenAI 官方产品概念 Demo；所示界面与示例数据仅用于演示，相关品牌及商标归其权利人所有。*\n`;
}

export function buildWechatHtml(
  input: TutorialExportInput,
  imagePath: ImagePathResolver,
) {
  const steps = includedSteps(input)
    .map(
      (step, index) => `
        <section style="margin:0 0 52px;">
          <div style="display:flex;align-items:center;gap:12px;margin:0 0 16px;">
            <span style="display:inline-flex;width:32px;height:32px;align-items:center;justify-content:center;border-radius:9px;background:#7657ff;color:#fff;font-size:12px;font-weight:700;">${String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 style="margin:0;color:#14161d;font-size:20px;line-height:1.45;">${escapeHtml(singleLine(step.title))}</h2>
              <p style="margin:3px 0 0;color:#818696;font-size:11px;letter-spacing:.08em;">VIDEO TIME · ${escapeHtml(step.time)}</p>
            </div>
          </div>
          ${htmlParagraphs(step.body)}
          <img src="${escapeHtml(imagePath(step, index))}" alt="${escapeHtml(singleLine(step.title))}" style="display:block;width:100%;height:auto;border:1px solid #e5e7eb;border-radius:12px;" />
        </section>`,
    )
    .join('');

  return `<article style="box-sizing:border-box;max-width:760px;margin:0 auto;padding:32px 24px;background:#fff;color:#14161d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;">
    <p style="margin:0 0 14px;color:#7657ff;font-size:12px;font-weight:700;letter-spacing:.08em;">录见 · 教程草稿</p>
    <h1 style="margin:0;color:#101219;font-size:34px;line-height:1.25;letter-spacing:-.03em;">${escapeHtml(singleLine(input.title))}</h1>
    <div style="margin:24px 0 42px;padding:16px 18px;border-radius:12px;background:#f3f4f7;color:#434754;font-size:15px;line-height:1.8;">${escapeHtml(input.summary).replace(/\r?\n/g, '<br>')}</div>
    ${steps}
    <p style="margin:40px 0 0;padding-top:18px;border-top:1px solid #eceef2;color:#8a8f9d;font-size:11px;line-height:1.7;">本页面为非官方产品概念 Demo；所示界面与示例数据仅用于演示，相关品牌及商标归其权利人所有。</p>
  </article>`;
}

export async function createTutorialZip(input: TutorialExportInput) {
  const { strToU8, zipSync } = await import('fflate');
  const steps = includedSteps(input);
  const root = safeBasename(input.title);
  const files: Record<string, Uint8Array> = {};
  const assetNames = steps.map((step, index) =>
    stepAssetName(index, step.image),
  );

  await Promise.all(
    steps.map(async (step, index) => {
      const response = await fetch(step.image, { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`截图读取失败：${step.title}`);
      files[`${root}/${assetNames[index]}`] = new Uint8Array(
        await response.arrayBuffer(),
      );
    }),
  );

  const relativePath = (_step: TutorialExportStep, index: number) =>
    assetNames[index];
  const markdown = buildMarkdown(input, relativePath);
  const article = buildWechatHtml(input, relativePath);
  const standaloneHtml = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(singleLine(input.title))}</title></head><body style="margin:0;background:#f3f4f7;">${article}</body></html>`;
  const readme =
    '录见图文包\n\n1. 教程.md：Markdown 文稿，图片使用相对路径。\n2. 公众号预览.html：双击打开后，可复制排版到内容编辑器。\n3. images：全部教程截图，可单独上传。\n\n发布前请再次核对文字、截图和平台规则。\n';

  files[`${root}/教程.md`] = strToU8(markdown);
  files[`${root}/公众号预览.html`] = strToU8(standaloneHtml);
  files[`${root}/使用说明.txt`] = strToU8(readme);

  const archive = zipSync(files, { level: 6 });
  const bytes = new Uint8Array(archive.byteLength);
  bytes.set(archive);
  return new Blob([bytes.buffer], { type: 'application/zip' });
}

export async function writeRichClipboard(html: string, plain: string) {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      return 'rich' as const;
    } catch {
      // Some browsers expose ClipboardItem but reject rich clipboard writes.
    }
  }
  await navigator.clipboard.writeText(plain);
  return 'plain' as const;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
