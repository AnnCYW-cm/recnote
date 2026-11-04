import { expect, test } from '@playwright/test';

test('新建任务弹窗支持键盘并安全处理空日期', async ({ page }) => {
  await page.goto('/cases/muwa-board');
  await page.waitForLoadState('networkidle');
  const newTask = page.getByTestId('new-task-button');

  await newTask.click();
  await expect(page.getByTestId('task-title-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: '新建任务' })).toBeHidden();
  await expect(newTask).toBeFocused();

  await newTask.click();
  await page.getByTestId('task-title-input').fill('检查发布素材');
  await page.locator('#new-task-due').fill('');
  await page.getByTestId('create-task-button').click();
  await expect(page.getByText('任务详情')).toBeVisible();
  await page.getByRole('button', { name: '关闭任务详情' }).last().click();
  await expect(page.getByText('未设置')).toBeVisible();
  await expect(page.getByText(/NaN/)).toHaveCount(0);
});

test('手机端看板不再使用横向三列画布', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/cases/muwa-board');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  await expect(page.getByLabel('搜索任务').last()).toBeVisible();
  await expect(page.getByTestId('new-task-button')).toHaveAttribute(
    'aria-label',
    '新建任务',
  );
});
