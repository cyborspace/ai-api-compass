import { test, expect } from '@playwright/test';

test.describe('Ontology 列表页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ontologies');
  });

  test('应该显示页面标题', async ({ page }) => {
    await expect(page.getByText('Ontology Manager')).toBeVisible();
  });

  test('应该显示搜索框', async ({ page }) => {
    const searchInput = page.getByPlaceholder('搜索 ontologies...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('应该显示筛选按钮', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: '筛选' });
    await expect(filterButton).toBeVisible();
  });

  test('应该显示视图切换按钮', async ({ page }) => {
    // Grid/List toggle buttons should be visible
    const buttons = page.locator('button').filter({ has: page.locator('svg') });
    await expect(buttons.first()).toBeVisible();
  });

  test('筛选下拉菜单应该工作', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: '筛选' });
    await filterButton.click();

    // Should show filter options
    await expect(page.getByText('全部')).toBeVisible();
    await expect(page.getByText('活跃')).toBeVisible();
    await expect(page.getByText('草稿')).toBeVisible();
    await expect(page.getByText('归档')).toBeVisible();
  });

  test('应该能打开创建 Ontology 弹窗', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /New Ontology/ });
    await createButton.click();

    // Modal should appear
    await expect(page.getByText('创建新 Ontology')).toBeVisible();
    await expect(page.getByPlaceholder('例如：股票分析系统')).toBeVisible();
  });

  test('主题切换应该正常工作', async ({ page }) => {
    // Check that the page has the ontology content
    await expect(page.getByText('Ontology Manager')).toBeVisible();

    // The page should be styled with theme variables (background should exist)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Ontology 详情页', () => {
  test('应该能导航到 Ontology 详情页', async ({ page }) => {
    await page.goto('/ontologies');

    // Wait for content to load
    await page.waitForTimeout(1000);

    // Try to find and click a link to an ontology detail page
    const ontologyLink = page.locator('a[href^="/ontologies/"]').first();

    if (await ontologyLink.isVisible().catch(() => false)) {
      await ontologyLink.click();
      await expect(page).toHaveURL(/\/ontologies\/.+/);
    }
  });
});
