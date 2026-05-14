# AI API Compass 部署指南

## 架构

- **前端**: Next.js → Vercel (免费)
- **后端**: Fastify + Docker → Render (免费)
- **数据库**: PostgreSQL → Render (免费)
- **缓存**: Redis → Render (免费)

## 部署步骤

### 1. 推送代码到 GitHub

```bash
git remote add origin https://github.com/yourusername/ai-api-compass.git
git branch -M main
git push -u origin main
```

### 2. 部署后端到 Render

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 点击 "New +" → "Blueprint"
3. 连接您的 GitHub 仓库
4. Render 会自动读取 `render.yaml` 配置
5. 部署完成后，获取后端 URL

### 3. 部署前端到 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 导入 GitHub 仓库
3. 设置根目录为 `frontend`
4. 环境变量已配置在 `.env.production`
5. 部署

### 4. 更新 CORS

部署后，更新 Render 后端的环境变量 `CORS_ORIGINS` 为实际的前端域名。

## 免费额度

| 服务 | 免费额度 |
|------|----------|
| Render Web | 750小时/月 |
| Render PostgreSQL | 1GB |
| Render Redis | 25MB |
| Vercel | 100GB/月 |
