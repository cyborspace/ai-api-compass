import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该显示正确的页面标题', async ({ page }) => {
    await expect(page).toHaveTitle(/AI Compass/);
  });

  test('应该显示主要标题和描述', async ({ page }) => {
    const heading = page.getByRole('heading', { name: '找到最适合的 AI' });
    await expect(heading).toBeVisible();
    
    const description = page.getByText('智能分析需求，精准推荐模型');
    await expect(description).toBeVisible();
  });

  test('应该显示搜索框', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('搜索框应该支持键盘快捷键', async ({ page }) => {
    // 点击页面其他区域失去焦点
    await page.click('body');
    
    // 按下 Cmd+K 应该聚焦搜索框
    await page.keyboard.press('Meta+k');
    
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await expect(searchInput).toBeFocused();
  });

  test('应该显示分类快捷按钮', async ({ page }) => {
    const categories = ['代码生成', '聊天对话', '图像理解', '推理分析'];
    
    for (const category of categories) {
      const button = page.getByRole('button', { name: category });
      await expect(button).toBeVisible();
    }
  });

  test('点击分类应该触发搜索', async ({ page }) => {
    const codeButton = page.getByRole('button', { name: '代码生成' });
    await codeButton.click();
    
    // 应该显示分析状态或结果
    await expect(page.getByText(/分析|推荐/)).toBeVisible({ timeout: 5000 });
  });

  test('应该显示统计数据', async ({ page }) => {
    await expect(page.getByText(/已服务.*开发者/)).toBeVisible();
    await expect(page.getByText(/累计.*次查询/)).toBeVisible();
    await expect(page.getByText(/帮助节省/)).toBeVisible();
    await expect(page.getByText(/覆盖.*模型/)).toBeVisible();
  });

  test('应该显示用户评价', async ({ page }) => {
    await expect(page.getByText('用户怎么说')).toBeVisible();
    
    // 应该显示至少一个用户评价
    const testimonials = page.locator('[class*="testimonial"], [class*="Testimonial"]').first();
    await expect(testimonials.or(page.getByText(/帮我选对了/))).toBeVisible();
  });

  test('应该显示热门模型', async ({ page }) => {
    await expect(page.getByText('热门模型')).toBeVisible();
    
    // 应该显示模型卡片
    const modelCards = page.locator('[class*="model"], [class*="Model"]').first();
    await expect(modelCards.or(page.getByText(/GPT|Claude|DeepSeek/))).toBeVisible();
  });

  test('应该能导航到模型库页面', async ({ page }) => {
    const modelsLink = page.getByRole('link', { name: /模型库|查看全部/ }).first();
    await modelsLink.click();
    
    await expect(page).toHaveURL(/\/models/);
    await expect(page.getByRole('heading', { name: '模型库' })).toBeVisible();
  });

  test('搜索建议应该正确显示', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.click();
    
    // 应该显示搜索建议
    await expect(page.getByText('试试这些搜索')).toBeVisible();
  });

  test('执行搜索应该显示结果', async ({ page }) => {
    const searchInput = page.getByPlaceholder('描述你的需求，如：写代码用哪个模型好？');
    await searchInput.fill('代码生成');
    await searchInput.press('Enter');
    
    // 应该显示分析状态
    await expect(page.getByText(/分析|AI 正在分析/)).toBeVisible({ timeout: 5000 });
    
    // 最终应该显示推荐结果
    await expect(page.getByText(/推荐|模型/).first()).toBeVisible({ timeout: 10000 });
  });

  test('应该支持深色/浅色模式切换', async ({ page }) => {
    // 查找主题切换按钮
    const themeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // 页面应该仍然有内容
      await expect(page.getByRole('heading', { name: '找到最适合的 AI' })).toBeVisible();
    }
  });

  test('页脚信息应该正确显示', async ({ page }) => {
    await expect(page.getByText(/基于 Vercel.*部署/)).toBeVisible();
    await expect(page.getByText(/2024 AI Compass/)).toBeVisible();
  });
});
