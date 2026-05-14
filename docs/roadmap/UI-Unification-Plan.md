# AI API Compass - 页面设计统一计划

> 目标：确保所有页面的风格与首页科幻风格一致，建立统一的设计系统

---

## 一、现状分析

### 1.1 首页风格特征（基准风格）

首页采用**科幻暗色主题（Sci-Fi Dark Theme）**，核心特征：

| 维度 | 具体表现 |
|------|----------|
| **背景** | 深蓝黑色 `bg-slate-950` + Canvas 动画网格 + 粒子效果 + 径向渐变光晕 |
| **主色调** | 青色 (Cyan `#06b6d4` / `#22d3ee`) + 紫色 (Purple `#8b5cf6`) |
| **文字颜色** | 主文字 `text-cyan-50`，次级 `text-cyan-400/40`，弱化 `text-cyan-400/30` |
| **卡片样式** | 玻璃拟态 `backdrop-filter: blur(12px)` + 半透明背景 + 青色边框发光 |
| **按钮样式** | 青色渐变背景 `bg-cyan-500` + 深色文字 + 发光阴影 |
| **图标容器** | 渐变背景 + 边框 + 发光效果 |
| **动画** | reveal-up 入场动画、hover 边框发光、粒子连线 |
| **字体** | 标题使用 `font-mono` 等宽字体，正文使用无衬线字体 |

### 1.2 现有页面风格不一致问题

| 页面 | 当前问题 | 与首页差异 |
|------|----------|-----------|
| **工具库** `/tools/list` | 使用 `glass-card` + `gradient-text` + `icon-box-purple` | 颜色系统不一致（紫/靛蓝 vs 青/紫） |
| **对比页** `/compare` | 使用 `glass-card` + `icon-box-purple` + `btn-gradient` | 缺少科幻背景，颜色偏紫 |
| **排名页** `/rankings` | 使用 CSS 变量 `--bg-primary` + `--accent` | 相对最接近，但缺少动画和发光效果 |
| **收藏页** `/favorites` | 使用 `glass-card` + `gradient-text` + `btn-gradient` | 颜色系统不一致 |
| **分类页** `/categories` | 使用 `bg-gray-50 dark:bg-gray-900` + 白色卡片 | **严重不一致**，完全是另一种风格 |
| **分类详情** `/categories/[slug]` | 使用 `glass-card` + `gradient-text` | 相对接近，但缺少科幻元素 |
| **工具详情** `/tools/list/[slug]` | 使用 `glass-card` + `icon-box-purple` | 颜色偏紫，缺少青色发光 |
| **Ontology页** | 使用 CSS 变量系统 | 相对一致，但缺少动画 |

### 1.3 核心问题总结

1. **颜色系统混乱**：首页使用 `cyan` 为主色，其他页面使用 `purple/indigo` 或 CSS 变量 `--accent`（红色系）
2. **缺少共享组件**：`glass-card`、`gradient-text`、`icon-box-*`、`btn-*` 等类名未在 CSS 中定义，依赖 Tailwind 编译时处理
3. **背景不统一**：只有首页有科幻背景动画，其他页面使用纯色或简单渐变
4. **动画不一致**：首页有 reveal-up 等入场动画，其他页面直接渲染
5. **Header 不统一**：首页有自定义 Header，其他页面缺少或样式不同

---

## 二、设计系统规范（Design System）

### 2.1 颜色系统

```css
/* 主色调 - 科幻青紫 */
--sci-fi-cyan: #06b6d4;        /* 主青色 */
--sci-fi-cyan-light: #22d3ee;  /* 亮青色 */
--sci-fi-purple: #8b5cf6;      /* 主紫色 */
--sci-fi-purple-light: #a78bfa; /* 亮紫色 */

/* 背景色 */
--bg-primary: #0c0c0e;         /* 最深背景 */
--bg-secondary: #141416;       /* 次级背景 */
--bg-card: rgba(6, 182, 212, 0.02);  /* 卡片背景（带青色 tint） */
--bg-card-hover: rgba(6, 182, 212, 0.05);

/* 文字色 */
--text-primary: #f5f5f7;       /* 主文字 */
--text-secondary: rgba(34, 211, 238, 0.4);  /* 青色40% */
--text-tertiary: rgba(34, 211, 238, 0.3);   /* 青色30% */
--text-muted: rgba(34, 211, 238, 0.2);      /* 青色20% */

/* 边框色 */
--border-default: rgba(6, 182, 212, 0.1);   /* 青色10% */
--border-hover: rgba(6, 182, 212, 0.3);     /* 青色30% */
--border-active: rgba(6, 182, 212, 0.5);    /* 青色50% */

/* 功能色 */
--success: #34d399;            /* 成功绿 */
--warning: #fbbf24;            /* 警告黄 */
--danger: #f87171;             /* 危险红 */
```

### 2.2 组件规范

#### Glass Card（玻璃卡片）
```css
.glass-card {
  background: rgba(6, 182, 212, 0.02);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(6, 182, 212, 0.1);
  border-radius: 16px;
  transition: all 0.3s ease;
}
.glass-card:hover {
  background: rgba(6, 182, 212, 0.05);
  border-color: rgba(6, 182, 212, 0.2);
}
```

#### Gradient Text（渐变文字）
```css
.gradient-text {
  background: linear-gradient(135deg, #22d3ee, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

#### Icon Box（图标容器）
```css
.icon-box {
  background: linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1));
  border: 1px solid rgba(6,182,212,0.2);
  color: #22d3ee;
  box-shadow: 0 0 15px rgba(6,182,212,0.15);
}
```

#### Sci-Fi Button（科幻按钮）
```css
.btn-sci-fi {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: #0c0c0e;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(6,182,212,0.3);
  transition: all 0.3s ease;
}
.btn-sci-fi:hover {
  background: linear-gradient(135deg, #22d3ee, #06b6d4);
  box-shadow: 0 0 30px rgba(6,182,212,0.5);
  transform: scale(1.02);
}
```

#### Badge（标签）
```css
.badge-cyan {
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.2);
}
.badge-green {
  background: rgba(52, 211, 153, 0.1);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.2);
}
```

### 2.3 布局规范

#### 页面结构
```
┌─────────────────────────────────────┐
│ SciFiBackground (fixed, z-0)        │
├─────────────────────────────────────┤
│ Header (fixed, z-50, glass effect)  │
├─────────────────────────────────────┤
│                                     │
│  Main Content (pt-16, relative z-10)│
│  ┌─────────────────────────────┐    │
│  │  max-w-[1200px] mx-auto     │    │
│  │  px-6 py-8                  │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

#### 间距规范
- 页面内边距：`px-6`（移动端）/ `px-8`（桌面端）
- 内容最大宽度：`max-w-[1200px]`
- 卡片间距：`gap-4` / `gap-6`
- 区块间距：`mb-8` / `mb-12`

### 2.4 动画规范

#### 入场动画
```css
.animate-reveal-up {
  animation: reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
```

#### Hover 效果
- 卡片：`hover:border-cyan-400/20 hover:bg-cyan-400/5`
- 按钮：`hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02]`
- 链接：`hover:text-cyan-400 transition-colors`

---

## 三、页面改造计划

### 3.1 第一阶段：基础设计系统建设

#### 任务 1.1：创建共享 CSS 文件
- **文件**：`frontend/app/styles/design-system.css`
- **内容**：定义所有共享类名（glass-card、gradient-text、icon-box、btn-sci-fi、badge-* 等）
- **引入**：在 `layout.tsx` 中全局引入

#### 任务 1.2：创建共享背景组件
- **文件**：`frontend/src/components/SciFiBackground.tsx`
- **功能**：提取首页的 Canvas 动画背景为可复用组件
- **参数**：支持 `intensity`、`colorScheme`、`showGrid`、`showParticles` 等配置

#### 任务 1.3：创建共享 Header 组件
- **文件**：`frontend/src/components/layout/SciFiHeader.tsx`
- **功能**：统一导航栏，包含 Logo、导航链接、用户操作
- **样式**：玻璃拟态效果 + 青色边框

### 3.2 第二阶段：页面逐一改造

#### 任务 2.1：分类页 `/categories` 改造
**当前问题**：使用 `bg-gray-50` 白色背景，风格完全不匹配
**改造内容**：
- [ ] 添加 SciFiBackground 背景
- [ ] 替换卡片样式为 glass-card
- [ ] 替换按钮样式为 btn-sci-fi
- [ ] 使用 gradient-text 标题
- [ ] 添加 reveal-up 入场动画

#### 任务 2.2：工具库 `/tools/list` 改造
**当前问题**：颜色偏紫（purple），与首页青色不一致
**改造内容**：
- [ ] 统一颜色为 cyan 系统
- [ ] 替换 glass-card 边框色为 cyan
- [ ] 替换 icon-box-purple 为 icon-box（cyan）
- [ ] 统一按钮样式

#### 任务 2.3：对比页 `/compare` 改造
**当前问题**：缺少背景，颜色偏紫
**改造内容**：
- [ ] 添加 SciFiBackground
- [ ] 统一颜色系统
- [ ] 优化对比表格样式（添加发光边框）

#### 任务 2.4：排名页 `/rankings` 改造
**当前问题**：相对较好，但缺少动画和发光效果
**改造内容**：
- [ ] 添加 SciFiBackground（轻量版）
- [ ] 为排名列表添加 hover 发光效果
- [ ] 添加入场动画

#### 任务 2.5：收藏页 `/favorites` 改造
**当前问题**：使用旧的颜色系统
**改造内容**：
- [ ] 统一为 cyan 颜色系统
- [ ] 替换卡片和按钮样式
- [ ] 优化空状态样式

#### 任务 2.6：工具详情页 `/tools/list/[slug]` 改造
**当前问题**：颜色偏紫
**改造内容**：
- [ ] 统一颜色系统
- [ ] 优化信息卡片布局
- [ ] 添加相关工具推荐区块

#### 任务 2.7：Ontology 相关页面改造
**当前问题**：风格相对统一但缺少科幻元素
**改造内容**：
- [ ] 添加轻量 SciFiBackground
- [ ] 统一卡片和按钮样式

### 3.3 第三阶段：交互和动画统一

#### 任务 3.1：加载状态统一
- 创建共享 Loading 组件（使用 cyan 色旋转动画）
- 替换所有页面的加载状态

#### 任务 3.2：空状态统一
- 创建共享 EmptyState 组件
- 统一图标、文字、按钮样式

#### 任务 3.3：错误状态统一
- 创建共享 ErrorState 组件
- 统一错误图标、文字、重试按钮

#### 任务 3.4：页面转场动画
- 添加页面切换时的过渡动画
- 统一入场动画（reveal-up）

### 3.4 第四阶段：细节优化

#### 任务 4.1：滚动条样式
- 统一自定义滚动条样式（已部分实现，需检查所有页面）

#### 任务 4.2：响应式适配
- 确保所有页面在移动端有合适的布局
- 统一断点处理

#### 任务 4.3：字体统一
- 确保所有页面使用相同的字体栈
- 统一字号层级

---

## 四、实施优先级

| 优先级 | 任务 | 影响范围 | 预估工作量 |
|--------|------|----------|-----------|
| **P0** | 创建共享 CSS 设计系统 | 所有页面 | 2h |
| **P0** | 创建 SciFiBackground 组件 | 所有页面 | 1.5h |
| **P0** | 创建共享 Header | 所有页面 | 1.5h |
| **P1** | 改造 `/categories` 页面 | 1个页面 | 1h |
| **P1** | 改造 `/tools/list` 页面 | 1个页面 | 1.5h |
| **P1** | 改造 `/compare` 页面 | 1个页面 | 1.5h |
| **P1** | 改造 `/rankings` 页面 | 1个页面 | 1h |
| **P2** | 改造 `/favorites` 页面 | 1个页面 | 1h |
| **P2** | 改造 `/tools/list/[slug]` 页面 | 1个页面 | 1.5h |
| **P2** | 改造 Ontology 页面 | 3个页面 | 2h |
| **P3** | 加载/空/错误状态统一 | 所有页面 | 1.5h |
| **P3** | 页面转场动画 | 所有页面 | 1h |

**总计预估：约 17 小时**

---

## 五、验收标准

### 5.1 视觉一致性检查清单

- [ ] 所有页面使用相同的深色科幻背景
- [ ] 所有卡片使用 glass-card 样式（半透明 + 模糊 + 青色边框）
- [ ] 所有标题使用 gradient-text（青紫渐变）
- [ ] 所有按钮使用 btn-sci-fi 样式（青色渐变 + 发光）
- [ ] 所有图标容器使用 icon-box 样式（渐变背景 + 发光）
- [ ] 所有标签使用 badge-* 样式（半透明 + 彩色边框）
- [ ] 所有页面有统一的 Header
- [ ] 所有加载状态使用统一的 Loading 组件
- [ ] 所有空状态使用统一的 EmptyState 组件
- [ ] 所有错误状态使用统一的 ErrorState 组件

### 5.2 交互一致性检查清单

- [ ] 所有卡片有 hover 效果（边框发光 + 背景变亮）
- [ ] 所有按钮有 hover 效果（发光增强 + 轻微放大）
- [ ] 页面内容有入场动画（reveal-up）
- [ ] 滚动条样式统一

---

## 六、风险与注意事项

### 6.1 技术风险
- **Tailwind 类名冲突**：确保新添加的 CSS 类名不会与 Tailwind 默认类名冲突
- **性能影响**：SciFiBackground 的 Canvas 动画可能影响低端设备性能，需提供 `reduced-motion` 降级方案
- **深色模式**：当前设计基于深色模式，需确保所有页面强制使用深色主题

### 6.2 设计风险
- **过度设计**：避免在所有页面都添加复杂的背景动画，部分页面可使用简化版背景
- **可读性**：确保青色文字在深色背景上有足够的对比度

### 6.3 实施建议
1. **先建设基础**：先完成共享组件和 CSS，再改造页面
2. **逐个验证**：每改造一个页面，立即验证视觉效果
3. **保持灵活**：共享组件应支持参数配置，以适应不同页面的需求
