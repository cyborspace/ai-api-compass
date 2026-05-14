/**
 * Events Routes
 * 
 * 事件 API 路由
 * 
 * 端点:
 * - POST /api/aigc/events/batch - 批量提交事件
 * - GET /api/aigc/tools/:rid/heat - 获取工具热度
 * - GET /api/aigc/heat/hot - 获取热门工具
 * - GET /api/aigc/heat/rising - 获取上升工具
 * - GET /api/aigc/heat/history/:rid - 获取热度历史
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  HeatCalculator,
  getHeatCalculator,
  EventType,
  HeatPeriod,
  EventData,
  HEAT_LEVELS,
  EVENT_WEIGHTS,
} from '../services/heat-calculator.js';
import {
  EventValidator,
  getEventValidator,
  EventInput,
  BatchEventInput,
} from '../lib/analytics/event-validator.js';

// =============================================================================
// Request/Response Types
// =============================================================================

interface BatchEventsRequest {
  Body: BatchEventInput;
}

interface ToolHeatRequest {
  Params: { rid: string };
  Querystring: { period?: HeatPeriod };
}

interface HotToolsRequest {
  Querystring: {
    period?: HeatPeriod;
    limit?: number;
    offset?: number;
  };
}

interface RisingToolsRequest {
  Querystring: {
    period?: HeatPeriod;
    limit?: number;
  };
}

interface HeatHistoryRequest {
  Params: { rid: string };
  Querystring: {
    period?: HeatPeriod;
    days?: number;
  };
}

interface SchedulerStatusRequest {
  Querystring: {
    action?: 'start' | 'stop' | 'status';
  };
}

// =============================================================================
// Schema Definitions
// =============================================================================

const batchEventsSchema = {
  body: {
    type: 'object',
    required: ['events'],
    properties: {
      events: {
        type: 'array',
        minItems: 1,
        maxItems: 1000,
        items: {
          type: 'object',
          required: ['toolRid', 'eventType'],
          properties: {
            toolRid: { type: 'string', minLength: 1, maxLength: 256 },
            eventType: {
              type: 'string',
              enum: ['search', 'click', 'compare', 'bookmark', 'share'],
            },
            userId: { type: 'string', maxLength: 256 },
            sessionId: { type: 'string', maxLength: 256 },
            metadata: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};

const toolHeatSchema = {
  params: {
    type: 'object',
    required: ['rid'],
    properties: {
      rid: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['1h', '24h', '7d', '30d'] },
    },
  },
};

const hotToolsSchema = {
  querystring: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0, default: 0 },
    },
  },
};

const risingToolsSchema = {
  querystring: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
};

const heatHistorySchema = {
  params: {
    type: 'object',
    required: ['rid'],
    properties: {
      rid: { type: 'string' },
    },
  },
  querystring: {
    type: 'object',
    properties: {
      period: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' },
      days: { type: 'integer', minimum: 1, maximum: 30, default: 7 },
    },
  },
};

// =============================================================================
// Routes
// =============================================================================

export async function eventsRoutes(fastify: FastifyInstance) {
  const prisma = fastify.prisma;
  const calculator = getHeatCalculator(prisma);
  const validator = getEventValidator(prisma);

  // ===========================================================================
  // POST /api/aigc/events/batch - 批量提交事件
  // ===========================================================================
  fastify.post<BatchEventsRequest>(
    '/events/batch',
    {
      schema: batchEventsSchema,
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { events } = request.body;

      // 验证事件
      const validation = await validator.validateBatchEvents({ events });

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
          warnings: validation.warnings,
        });
      }

      // 标准化事件数据
      const normalizedEvents: EventData[] = events.map(event => ({
        toolRid: event.toolRid,
        eventType: event.eventType.toLowerCase() as EventType,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.metadata,
      }));

      // 记录事件
      const count = await calculator.recordEvents(normalizedEvents);

      return {
        success: true,
        data: {
          accepted: count,
          total: events.length,
          warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
        },
      };
    }
  );

  // ===========================================================================
  // POST /api/aigc/events/single - 提交单个事件
  // ===========================================================================
  fastify.post(
    '/events/single',
    {
      config: {
        rateLimit: {
          max: 300,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const event = request.body as EventInput;

      // 验证事件
      const validation = await validator.validateEvent(event);

      if (!validation.valid) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        });
      }

      // 记录事件
      const normalizedEvent: EventData = {
        toolRid: event.toolRid,
        eventType: event.eventType.toLowerCase() as EventType,
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.metadata,
      };

      await calculator.recordEvent(normalizedEvent);

      return {
        success: true,
        data: {
          toolRid: event.toolRid,
          eventType: event.eventType,
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/tools/:rid/heat - 获取工具热度
  // ===========================================================================
  fastify.get<ToolHeatRequest>(
    '/tools/:rid/heat',
    { schema: toolHeatSchema },
    async (request, reply) => {
      const { rid } = request.params;
      const { period } = request.query;

      // 如果指定了周期,只返回该周期
      if (period) {
        const result = await calculator.calculateHeat(rid, period);

        return {
          success: true,
          data: {
            toolRid: rid,
            period,
            ...result,
            levelInfo: {
              level: result.level,
              icon: result.levelIcon,
              label: result.levelLabel,
            },
          },
        };
      }

      // 否则返回所有周期
      const result = await calculator.getToolHeat(rid);

      if (!result) {
        // 如果没有快照,实时计算
        const calculated = await calculator.calculateAllPeriods(rid);

        return {
          success: true,
          data: {
            toolRid: rid,
            periods: calculated.periods,
            levelInfo: {
              level: calculated.periods['24h'].level,
              icon: calculated.periods['24h'].levelIcon,
              label: calculated.periods['24h'].levelLabel,
            },
          },
        };
      }

      return {
        success: true,
        data: {
          toolRid: rid,
          periods: result.periods,
          levelInfo: {
            level: result.periods['24h']?.level || 'FROZEN',
            icon: result.periods['24h']?.levelIcon || '❄️',
            label: result.periods['24h']?.levelLabel || '冷门',
          },
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/heat/hot - 获取热门工具
  // ===========================================================================
  fastify.get<HotToolsRequest>(
    '/heat/hot',
    { schema: hotToolsSchema },
    async (request, reply) => {
      const { period = '24h', limit = 20, offset = 0 } = request.query;

      const tools = await calculator.getHotTools(period, limit, offset);

      return {
        success: true,
        data: {
          period,
          tools: tools.map(t => ({
            toolRid: t.toolRid,
            heatScore: t.heatScore,
            trend: t.trend,
            trendChange: t.trendChange,
            eventCount: t.eventCount,
            level: t.level,
            levelIcon: t.levelIcon,
            levelLabel: t.levelLabel,
          })),
          pagination: {
            limit,
            offset,
            total: tools.length,
          },
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/heat/rising - 获取上升工具
  // ===========================================================================
  fastify.get<RisingToolsRequest>(
    '/heat/rising',
    { schema: risingToolsSchema },
    async (request, reply) => {
      const { period = '24h', limit = 20 } = request.query;

      const tools = await calculator.getRisingTools(period, limit);

      return {
        success: true,
        data: {
          period,
          tools: tools.map(t => ({
            toolRid: t.toolRid,
            heatScore: t.heatScore,
            trend: t.trend,
            trendChange: t.trendChange,
            eventCount: t.eventCount,
            level: t.level,
            levelIcon: t.levelIcon,
            levelLabel: t.levelLabel,
          })),
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/heat/history/:rid - 获取热度历史
  // ===========================================================================
  fastify.get<HeatHistoryRequest>(
    '/heat/history/:rid',
    { schema: heatHistorySchema },
    async (request, reply) => {
      const { rid } = request.params;
      const { period = '24h', days = 7 } = request.query;

      const history = await calculator.getHeatHistory(rid, period, days);

      return {
        success: true,
        data: {
          toolRid: rid,
          period,
          days,
          history: history.map(h => ({
            heatScore: h.heatScore,
            recordedAt: h.recordedAt,
            trend: h.trend,
          })),
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/heat/config - 获取热度配置
  // ===========================================================================
  fastify.get('/heat/config', async (request, reply) => {
    return {
      success: true,
      data: {
        eventWeights: EVENT_WEIGHTS,
        heatLevels: HEAT_LEVELS.map(l => ({
          level: l.level,
          icon: l.icon,
          label: l.label,
          range: `${l.minScore}-${l.maxScore}`,
        })),
        periods: ['1h', '24h', '7d', '30d'],
        decayRate: 0.95,
      },
    };
  });

  // ===========================================================================
  // POST /api/aigc/heat/update/:rid - 手动更新工具热度
  // ===========================================================================
  fastify.post<{ Params: { rid: string } }>(
    '/heat/update/:rid',
    async (request, reply) => {
      const { rid } = request.params;

      const periods = await calculator.calculateAllPeriods(rid);

      // 保存快照
      for (const period of Object.keys(periods.periods) as HeatPeriod[]) {
        await calculator.saveHeatSnapshot(periods.periods[period]);
      }

      return {
        success: true,
        data: {
          toolRid: rid,
          periods,
        },
      };
    }
  );

  // ===========================================================================
  // GET /api/aigc/heat/scheduler - 获取调度器状态
  // ===========================================================================
  fastify.get('/heat/scheduler', async (request, reply) => {
    // 动态导入避免循环依赖
    const { getHeatScheduler } = await import('../services/heat-scheduler.js');
    const scheduler = getHeatScheduler(prisma);

    return {
      success: true,
      data: scheduler.getStatus(),
    };
  });

  // ===========================================================================
  // POST /api/aigc/heat/scheduler/start - 启动调度器
  // ===========================================================================
  fastify.post('/heat/scheduler/start', async (request, reply) => {
    const { getHeatScheduler } = await import('../services/heat-scheduler.js');
    const scheduler = getHeatScheduler(prisma);

    scheduler.start();

    return {
      success: true,
      message: 'Heat scheduler started',
    };
  });

  // ===========================================================================
  // POST /api/aigc/heat/scheduler/stop - 停止调度器
  // ===========================================================================
  fastify.post('/heat/scheduler/stop', async (request, reply) => {
    const { getHeatScheduler } = await import('../services/heat-scheduler.js');
    const scheduler = getHeatScheduler(prisma);

    scheduler.stop();

    return {
      success: true,
      message: 'Heat scheduler stopped',
    };
  });

  // ===========================================================================
  // POST /api/aigc/heat/scheduler/run - 手动触发热度更新
  // ===========================================================================
  fastify.post('/heat/scheduler/run', async (request, reply) => {
    const { getHeatScheduler } = await import('../services/heat-scheduler.js');
    const scheduler = getHeatScheduler(prisma);

    await scheduler.runUpdate();

    return {
      success: true,
      message: 'Heat update triggered',
      stats: scheduler.getStatus(),
    };
  });
}

// =============================================================================
// Export
// =============================================================================

export default eventsRoutes;
