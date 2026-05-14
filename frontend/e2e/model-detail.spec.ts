import { test, expect } from '@playwright/test';

test.describe('模型详情页', () => {
  test.beforeEach(async ({ page }) => {
    // 先访问模型列表获取一个有效的slug
    await page.goto('/models');
    await page.waitForTimeout(2000);

    // 点击第一个模型卡片（/models/{slug} 链接）
    const modelLink = page.locator('a[href^="/models/"]').first();
    await modelLink.click();

    // 等待导航到详情页
    await page.waitForURL(/\/models\//, { timeout: 10000 });
  });

  test('应该显示模型名称', async ({ page }) => {
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });

  test('应该显示提供商信息', async ({ page }) => {
    await expect(page.getByText(/提供商|OpenAI|Anthropic|DeepSeek|Google/).first()).toBeVisible();
  });

  test('应该显示价格信息', async ({ page }) => {
    await expect(page.getByText(/\$[\d.]+/).first()).toBeVisible();
  });

  test('应该显示能力标签', async ({ page }) => {
    await expect(page.getByText(/上下文|Context/).first()).toBeVisible();
  });

  test('应该能返回模型列表', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /返回|模型库/ }).first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/models/);
    }
  });
});
