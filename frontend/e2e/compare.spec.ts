import { test, expect } from '@playwright/test';

test.describe('对比页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/compare');
  });

  test('应该显示页面标题', async ({ page }) => {
    const heading = page.getByRole('heading', { name: '模型对比' });
    await expect(heading).toBeVisible();
  });

  test('应该显示添加模型按钮', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /添加模型/ });
    await expect(addButton).toBeVisible();
  });

  test('添加模型功能应该工作', async ({ page }) => {
    // 点击添加模型
    const addButton = page.getByRole('button', { name: /添加模型/ });
    await addButton.click();

    // 应该显示模型选择弹窗
    await expect(page.getByText('选择模型')).toBeVisible({ timeout: 5000 });
  });

  test('成本计算器应该显示', async ({ page }) => {
    await expect(page.getByText('成本计算器')).toBeVisible();
  });

  test('应该能导航到模型库', async ({ page }) => {
    // 如果没有选择模型，应该有链接去模型库
    const modelsLink = page.getByRole('link', { name: /模型库|去模型库/ });
    if (await modelsLink.isVisible()) {
      await modelsLink.click();
      await expect(page).toHaveURL(/\/models/);
    }
  });
});
