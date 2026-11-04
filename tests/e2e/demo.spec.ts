import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
});

test('如实说明能力边界并完成交付门禁', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: /从录屏候选画面/ }),
  ).toBeVisible();
  await expect(page.getByText(/页面展示的是预置的自有案例结果/)).toBeVisible();

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
  await expect(page.getByText('图文包已下载，可离线使用')).toBeVisible();
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
