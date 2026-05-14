import { test, expect } from '@playwright/test';

test.describe('模型列表页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/models');
  });

  test('应该显示页面标题', async ({ page }) => {
    const heading = page.getByRole('heading', { name: '模型库' });
    await expect(heading).toBeVisible();
  });

  test('应该显示模型数量', async ({ page }) => {
    await expect(page.getByText(/探索.*个 AI 模型/)).toBeVisible();
  });

  test('应该显示搜索框', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索模型...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('应该显示分类筛选器', async ({ page }) => {
    const categorySelect = page.locator('select').filter({ hasText: /所有分类/ });
    await expect(categorySelect).toBeVisible();
  });

  test('应该显示提供商筛选器', async ({ page }) => {
    const providerSelect = page.locator('select').filter({ hasText: /所有提供商/ });
    await expect(providerSelect).toBeVisible();
  });

  test('应该显示排序选项', async ({ page }) => {
    const sortSelect = page.locator('select').filter({ hasText: /最受欢迎|价格最低|名称排序/ });
    await expect(sortSelect).toBeVisible();
  });

  test('应该显示视图切换按钮', async ({ page }) => {
    const gridButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(0);
    const listButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    
    await expect(gridButton).toBeVisible();
    await expect(listButton).toBeVisible();
  });

  test('应该显示模型卡片列表', async ({ page }) => {
    // 等待模型加载
    await page.waitForTimeout(2000);
    
    // 应该显示模型卡片
    const modelCards = page.locator('[class*="card"], [class*="Card"]').first();
    await expect(modelCards.or(page.getByText(/GPT|Claude|DeepSeek/))).toBeVisible();
  });

  test('搜索功能应该工作', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索模型...');
    await searchInput.fill('GPT');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 应该显示筛选结果
    await expect(page.getByText(/找到.*个模型/)).toBeVisible();
  });

  test('分类筛选应该工作', async ({ page }) => {
    const categorySelect = page.locator('select').filter({ hasText: /所有分类/ });
    await categorySelect.click();
    
    // 选择一个分类
    await categorySelect.selectOption({ index: 1 });
    
    // 等待筛选结果
    await page.waitForTimeout(1000);
    
    // 应该显示已筛选
    await expect(page.getByText(/已筛选:/)).toBeVisible();
  });

  test('排序功能应该工作', async ({ page }) => {
    const sortSelect = page.locator('select').filter({ hasText: /最受欢迎/ });
    await sortSelect.selectOption('价格最低');
    
    // 等待排序结果
    await page.waitForTimeout(1000);
    
    // 页面应该仍然显示模型
    await expect(page.getByText(/找到.*个模型/)).toBeVisible();
  });

  test('视图切换应该工作', async ({ page }) => {
    // 点击列表视图
    const listButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1);
    await listButton.click();
    
    // 等待视图切换
    await page.waitForTimeout(500);
    
    // 页面应该仍然显示内容
    await expect(page.getByRole('heading', { name: '模型库' })).toBeVisible();
  });

  test('点击模型应该导航到详情页', async ({ page }) => {
    // 等待模型加载
    await page.waitForTimeout(2000);
    
    // 点击第一个模型链接
    const modelLink = page.getByRole('link').first();
    await modelLink.click();
    
    // 应该导航到详情页
    await expect(page).toHaveURL(/\/models\//);
  });

  test('清除筛选应该工作', async ({ page }) => {
    // 先进行筛选
    const categorySelect = page.locator('select').filter({ hasText: /所有分类/ });
    await categorySelect.selectOption({ index: 1 });
    await page.waitForTimeout(1000);
    
    // 点击清除筛选
    const clearButton = page.getByText('清除筛选');
    await clearButton.click();
    
    // 筛选标签应该消失
    await expect(page.getByText(/已筛选:/)).not.toBeVisible();
  });

  test('空搜索结果应该显示提示', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索模型...');
    await searchInput.fill('不存在的模型xyz123');
    
    // 等待搜索
    await page.waitForTimeout(1000);
    
    // 应该显示无结果提示
    await expect(page.getByText(/没有找到符合条件的模型/)).toBeVisible();
  });
});
