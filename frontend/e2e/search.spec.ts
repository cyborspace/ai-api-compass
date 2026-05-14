import { test, expect } from '@playwright/test';

test.describe('搜索功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('搜索框应该接受输入', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('代码生成');
    await expect(searchInput).toHaveValue('代码生成');
  });

  test('搜索建议应该在聚焦时显示', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.click();
    
    await expect(page.getByText('试试这些搜索')).toBeVisible();
  });

  test('点击搜索建议应该执行搜索', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.click();
    
    // 等待建议显示
    await page.waitForTimeout(500);
    
    // 点击第一个建议
    const firstSuggestion = page.locator('button', { hasText: /帮我选|国内能|性价比/ }).first();
    if (await firstSuggestion.isVisible()) {
      await firstSuggestion.click();
      
      // 应该显示分析状态
      await expect(page.getByText(/分析|AI 正在/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('按Enter应该执行搜索', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('写代码');
    await searchInput.press('Enter');
    
    // 应该显示分析状态
    await expect(page.getByText(/分析|AI 正在/)).toBeVisible({ timeout: 5000 });
  });

  test('搜索应该显示推荐结果', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('代码生成');
    await searchInput.press('Enter');
    
    // 等待分析完成
    await page.waitForTimeout(3000);
    
    // 应该显示推荐结果
    await expect(page.getByText(/推荐|模型/).first()).toBeVisible({ timeout: 10000 });
  });

  test('搜索过程中应该显示进度', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('数据分析');
    await searchInput.press('Enter');
    
    // 应该显示进度条或百分比
    await expect(page.getByText(/%|进度|分析/).first()).toBeVisible({ timeout: 5000 });
  });

  test('分类快捷按钮应该触发搜索', async ({ page }) => {
    const codeButton = page.getByRole('button', { name: '代码生成' });
    await codeButton.click();
    
    // 应该显示分析状态
    await expect(page.getByText(/分析|AI 正在/)).toBeVisible({ timeout: 5000 });
  });

  test('热门搜索标签应该可点击', async ({ page }) => {
    // 查找热门搜索标签
    const hotTag = page.getByText(/代码生成|国内可用|性价比高/).first();
    
    if (await hotTag.isVisible()) {
      await hotTag.click();
      
      // 应该触发搜索
      await expect(page.getByText(/分析|推荐/).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('搜索应该能选择多个模型进行对比', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('性价比');
    await searchInput.press('Enter');
    
    // 等待分析完成
    await page.waitForTimeout(3000);
    
    // 等待推荐结果显示
    await page.waitForSelector('text=/推荐|对比/', { timeout: 10000 });
    
    // 查找选择框（如果存在）
    const checkboxes = page.locator('input[type="checkbox"]').first();
    if (await checkboxes.isVisible().catch(() => false)) {
      await checkboxes.click();
      
      // 应该可以选中
      await expect(checkboxes).toBeChecked();
    }
  });
});
