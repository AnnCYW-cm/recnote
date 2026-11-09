import path from 'node:path';
import { expect, test, type Download } from '@playwright/test';
import { unzipSync } from 'fflate';

async function downloadBytes(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return new Uint8Array(Buffer.concat(chunks));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('如实说明能力边界并完成交付门禁', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /从录屏候选画面/ }),
  ).toBeVisible();
  await expect(page.getByText(/视频本地处理，不离开设备/)).toBeVisible();

  await page.getByRole('button', { name: '体验示例流程' }).click();
  await expect(page.getByText(/语义层尚未接入/)).toBeVisible();
  await page.getByRole('button', { name: /查看预置初稿/ }).click();

  const stepTitle = page.locator('#step-title');
  await stepTitle.fill('创建发布检查任务并打开详情');
  await expect(page.getByText(/文案已修改 · 待核对/)).toBeVisible();
  await page.getByRole('button', { name: '确认文字与画面一致' }).click();
  await expect(page.getByText('修改已人工核对', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /下载独立图文包/ }).click();
  await expect(page.getByText('请逐张检查截图隐私（0/6）')).toBeVisible();

  for (let index = 1; index <= 6; index += 1) {
    await page
      .getByRole('button', {
        name: new RegExp(`选择第 ${index} 张截图`),
      })
      .click();
    await page
      .getByRole('button', {
        name: `确认第 ${index} 张无敏感信息`,
      })
      .click();
  }

  await expect(page.getByText(/5 \/ 5 完成/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /下载独立图文包/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const files = unzipSync(await downloadBytes(download));
  const names = Object.keys(files);
  const markdownName = names.find((name) => name.endsWith('/教程.md'));
  const imageNames = names.filter((name) =>
    /\/images\/step-\d+\.jpg$/.test(name),
  );
  expect(markdownName).toBeTruthy();
  expect(imageNames).toHaveLength(6);
  expect(Buffer.from(files[markdownName!]).toString('utf8')).toContain(
    'images/step-01.jpg',
  );
  for (const imageName of imageNames)
    expect(Array.from(files[imageName].slice(0, 3))).toEqual([255, 216, 255]);
  await expect(page.getByText('图文包已下载，可离线使用')).toBeVisible();
});

test('真实读取本地录屏并生成动态候选初稿', async ({ page }) => {
  const recording = path.resolve(
    process.cwd(),
    'public/cases/muwa-board/recording.mp4',
  );
  await expect(
    page.getByRole('button', { name: '体验示例流程' }),
  ).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles(recording);

  await expect(
    page.getByRole('button', { name: '在本地分析这段录屏' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '在本地分析这段录屏' }).click();
  await expect(
    page.getByRole('heading', { name: /正在把这段录屏/ }),
  ).toBeVisible();
  await expect(
    page.getByText(/^已从 \d+ 个采样画面中保留 \d+ 张候选截图$/),
  ).toBeVisible({
    timeout: 60_000,
  });

  await page.getByRole('button', { name: /进入教程工作台/ }).click();
  await expect(page.getByText(/本地视频草稿 · 仅保留在当前会话/)).toBeVisible();
  await expect(page.locator('#step-title')).toHaveValue('关键画面 01');
  await expect(page.getByText(/本地候选 · \d+ 个纳入步骤/)).toBeVisible();
  const stepButtons = page.getByRole('button', {
    name: /步骤 \d+：关键画面/,
  });
  const candidateCount = await stepButtons.count();
  expect(candidateCount).toBeGreaterThanOrEqual(2);

  await page.getByRole('button', { name: /下载独立图文包/ }).click();
  await expect(
    page.getByText('请先补全标题、摘要和每一步真实操作说明'),
  ).toBeVisible();

  for (let index = 1; index <= candidateCount; index += 1) {
    await page
      .getByRole('button', {
        name: new RegExp(`步骤 ${index}：关键画面`),
      })
      .click();
    await page
      .locator('#step-body')
      .fill(`在第 ${index} 个关键画面完成对应操作，并确认页面结果符合预期。`);
    await page.getByRole('button', { name: '确认文字与画面一致' }).click();
  }

  await page.getByRole('button', { name: '成稿预览' }).first().click();
  await page.getByRole('button', { name: '确认标题与摘要' }).click();
  for (let index = 1; index <= candidateCount; index += 1) {
    await page
      .getByRole('button', {
        name: new RegExp(`选择第 ${index} 张截图`),
      })
      .click();
    await page
      .getByRole('button', {
        name: `确认第 ${index} 张无敏感信息`,
      })
      .click();
  }

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /下载独立图文包/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
  const files = unzipSync(await downloadBytes(download));
  const names = Object.keys(files);
  const markdownName = names.find((name) => name.endsWith('/教程.md'));
  const imageNames = names.filter((name) =>
    /\/images\/step-\d+\.jpg$/.test(name),
  );
  expect(markdownName).toBeTruthy();
  expect(imageNames).toHaveLength(candidateCount);
  expect(Buffer.from(files[markdownName!]).toString('utf8')).toContain(
    'images/step-01.jpg',
  );
  for (const imageName of imageNames)
    expect(Array.from(files[imageName].slice(0, 3))).toEqual([255, 216, 255]);
  await expect(page.getByText('图文包已下载，可离线使用')).toBeVisible();
});

test('静态录屏不会被硬凑成多张关键画面', async ({ page }) => {
  const recording = path.resolve(
    process.cwd(),
    'tests/fixtures/static-screen.mp4',
  );
  await expect(
    page.getByRole('button', { name: '体验示例流程' }),
  ).toBeEnabled();
  await page.locator('input[type="file"]').setInputFiles(recording);
  await page.getByRole('button', { name: '在本地分析这段录屏' }).click();
  await expect(
    page.getByText(/^已从 \d+ 个采样画面中保留 1 张候选截图$/),
  ).toBeVisible({ timeout: 60_000 });
});

test('元数据路由可访问', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain('sitemap.xml');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain(
    'https://lujian-video-guide-demo.caiyiwenann.chatgpt.site',
  );
});
