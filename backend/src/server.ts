import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import type { Redis as RedisType } from 'ioredis';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Redis = require('ioredis');

// Routes
import { registerHealthRoutes } from './routes/health.js';
import { registerOntologyRoutes } from './routes/ontology-simple.js';
import { registerRoutes } from './routes/index.js';
import { aigcRoutes } from './routes/aigc.routes.js';
import { eventsRoutes } from './routes/events-simple.js';
import { rankingsRoutes } from './routes/rankings-simple.js';
import { ratingsRoutes } from './routes/ratings.routes.js';
import { recommendationsRoutes } from './routes/recommendations.routes.js';
import { registerFunctionsRoutes } from './routes/functions.routes.js';
import { registerObjectSetsRoutes } from './routes/object-sets.routes.js';
import { registerWebhookRoutes } from './routes/webhook.routes.js';
import { registerActionsRoutes } from './routes/actions.routes.js';
import { registerWebhookEventsRoutes } from './routes/webhook-events.routes.js';
import { registerOntologyHealthRoutes } from './routes/health.routes.js';
import { registerCostRoutes } from './routes/cost.routes.js';
import { registerQualityRoutes } from './routes/quality.routes.js';
import { registerMonitoringRoutes } from './routes/monitoring.routes.js';
import { registerDatasourceRoutes } from './routes/datasource.routes.js';
import { registerValueTypeRoutes } from './routes/value-type.routes.js';

// Plugins
import { requestLogger } from './plugins/request-logger.js';
import { errorHandler } from './plugins/error-handler.js';

// Services
import { getHeatScheduler } from './services/heat-scheduler.js';
import { getRankingScheduler } from './services/ranking/ranking-scheduler.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: RedisType | null;
  }
  interface FastifyRequest {
    startTime: number;
  }
}

export async function createServer() {
  const server = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: { colorize: true }
      } : undefined,
    },
  });

  // Register plugins
  await server.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(',') || true,
    credentials: true,
  });

  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry in ${context.after}`,
    }),
  });

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'AI API Compass - Palantir Ontology API',
        description: 'API following Palantir Foundry Ontology architecture pattern',
        version: '2.0.0',
      },
      servers: [
        { url: 'http://localhost:8000', description: 'Development' },
      ],
      tags: [
        { name: 'Ontology', description: 'Ontology schema operations (ObjectTypes, LinkTypes)' },
        { name: 'AIGC Tools', description: 'AI工具搜索、详情、对比' },
        { name: 'AIGC Compare', description: '多维度工具对比' },
        { name: 'AIGC Reviews', description: '用户评价管理' },
        { name: 'AIGC Categories', description: '工具分类管理' },
        { name: 'AIGC Events', description: '用户行为事件追踪' },
        { name: 'AIGC Heat', description: '工具热度计算与查询' },
        { name: 'AIGC Rankings', description: '工具排名计算与查询' },
        { name: 'recommendations', description: '个性化推荐服务' },
        { name: 'Objects', description: 'Object instance CRUD operations' },
        { name: 'Links', description: 'Link instance operations' },
        { name: 'Graph', description: 'Graph traversal (shortest-path, neighbors)' },
        { name: 'Actions', description: 'ActionType operations' },
        { name: 'Functions', description: 'Ontology Function operations' },
        { name: 'Object Sets', description: 'Object Sets query and filter API' },
        { name: 'Ranking', description: 'Ranking Functions' },
        { name: 'Heat', description: 'Heat calculation Functions' },
        { name: 'Scoring', description: 'Scoring Functions' },
        { name: 'Recommendation', description: 'Recommendation Functions' },
        { name: 'Scenario', description: 'Scenario Functions' },
        { name: 'Security', description: 'Anti-Gaming Functions' },
        { name: 'Webhooks', description: 'Writeback Webhook management and execution' },
        { name: 'Interfaces', description: 'Interface operations' },
        { name: 'Health', description: 'Health check' },
      ],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: { docExpansion: 'list', deepLinking: false },
  });

  // Initialize database and cache
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Redis connection (optional for future caching)
  let redis: RedisType | null = null;
  if (process.env.REDIS_URL) {
    try {
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });
      server.log.info('Redis connected');
    } catch (err) {
      server.log.warn('Redis connection failed, continuing without cache');
    }
  }

  // Decorate fastify instance
  server.decorate('prisma', prisma);
  server.decorate('redis', redis);

  // Register custom plugins
  await server.register(requestLogger);
  await server.register(errorHandler);

  // Register routes
  await server.register(registerHealthRoutes);
  await server.register(registerOntologyRoutes, { prefix: '/api' });
  await server.register(aigcRoutes, { prefix: '/api/aigc' });
  await server.register(eventsRoutes, { prefix: '/api/aigc' });
  await server.register(rankingsRoutes, { prefix: '/api/aigc' });
  await server.register(ratingsRoutes, { prefix: '/api/aigc' });
  await server.register(recommendationsRoutes, { prefix: '/api/aigc' });
  await server.register(registerFunctionsRoutes, { prefix: '/api' });
  await server.register(registerObjectSetsRoutes, { prefix: '/api' });
  await server.register(registerWebhookRoutes, { prefix: '/api' });
  await server.register(registerActionsRoutes, { prefix: '/api' });
  await server.register(registerWebhookEventsRoutes, { prefix: '/api' });
  await server.register(registerOntologyHealthRoutes, { prefix: '/api/aigc' });
  await server.register(registerCostRoutes, { prefix: '/api/aigc' });
  await server.register(registerQualityRoutes, { prefix: '/api/aigc' });
  await server.register(registerMonitoringRoutes, { prefix: '/api/aigc' });
  await server.register(registerDatasourceRoutes, { prefix: '/api' });
  await server.register(registerValueTypeRoutes, { prefix: '/api' });
  await registerRoutes(server);

  // Initialize Heat Scheduler (热度调度服务)
  const heatScheduler = getHeatScheduler(prisma, {
    updateInterval: parseInt(process.env.HEAT_UPDATE_INTERVAL || '300000'), // 默认 5 分钟
    batchSize: 100,
    saveHistory: true,
    runOnStart: process.env.HEAT_RUN_ON_START === 'true',
  });

  // Auto-start scheduler if enabled
  if (process.env.HEAT_SCHEDULER_AUTO_START !== 'false') {
    heatScheduler.start();
    server.log.info('Heat scheduler started');
  }

  // Initialize Ranking Scheduler (排名调度服务)
  const rankingScheduler = getRankingScheduler(prisma, {
    updateInterval: parseInt(process.env.RANKING_UPDATE_INTERVAL || '86400000'), // 默认每天
    batchSize: 100,
    saveHistory: true,
    runOnStart: process.env.RANKING_RUN_ON_START === 'true',
  });

  // Auto-start ranking scheduler if enabled
  if (process.env.RANKING_SCHEDULER_AUTO_START !== 'false') {
    rankingScheduler.start();
    server.log.info('Ranking scheduler started');
  }

  // Root route
  server.get('/', async () => ({
    name: 'AI API Compass - Palantir Ontology API',
    version: '2.0.0',
    status: 'running',
    documentation: '/documentation',
    health: '/health',
  }));

  // Graceful shutdown
  server.addHook('onClose', async () => {
    // Stop heat scheduler
    heatScheduler.stop();
    server.log.info('Heat scheduler stopped');
    
    // Stop ranking scheduler
    rankingScheduler.stop();
    server.log.info('Ranking scheduler stopped');
    
    await prisma.$disconnect();
    if (redis) await redis.quit();
  });

  return server;
}
