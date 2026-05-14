import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type EventType = 'SEARCH' | 'CLICK' | 'VIEW' | 'COMPARE' | 'BOOKMARK' | 'SHARE' | 'RATING';

const EVENT_WEIGHTS: Record<EventType, number> = {
  SEARCH: 0.1,
  CLICK: 1,
  VIEW: 0.5,
  COMPARE: 0.3,
  BOOKMARK: 2,
  SHARE: 3,
  RATING: 1,
};

export async function eventsRoutes(fastify: FastifyInstance) {

  fastify.post('/events/batch', async (request) => {
    const { events } = request.body as { events: any[]; batchId: string; clientTimestamp: string };
    
    if (!events || events.length === 0) {
      return { success: false, error: 'No events provided', receivedCount: 0 };
    }

    const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
    if (!aigcToolType) {
      return { success: true, receivedCount: events.length, message: 'No AIGCTool type found' };
    }

    let processed = 0;
    const errors: string[] = [];

    for (const event of events) {
      try {
        const eventType = event.eventType as EventType;
        const properties = event.properties || {};
        const toolRid = properties.toolRid || properties.query || 'unknown';

        await prisma.user_events.create({
          data: {
            id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            toolRid: toolRid,
            sessionId: event.sessionId || 'anonymous',
            userId: event.userId,
            eventType: eventType.toLowerCase(),
            metadata: properties,
            weight: EVENT_WEIGHTS[eventType] || 1,
            createdAt: new Date(event.timestamp || Date.now()),
          },
        });

        if (toolRid && toolRid !== 'unknown' && aigcToolType) {
          const tool = await prisma.objects.findFirst({
            where: { objectTypeId: aigcToolType.id, rid: toolRid }
          });

          if (tool) {
            const weight = EVENT_WEIGHTS[eventType] || 1;
            const props = tool.properties as Record<string, any> || {};
            const newViewCount = (props.viewCount || 0) + weight;
            
            await prisma.objects.update({
              where: { id: tool.id },
              data: { properties: { ...props, viewCount: newViewCount } },
            });
          }
        }

        processed++;
      } catch (err: any) {
        errors.push(`Event ${event.eventType}: ${err.message}`);
      }
    }

    return {
      success: true,
      receivedCount: processed,
      totalCount: events.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  });

  fastify.get<{ Params: { rid: string }; Querystring: { period?: string } }>(
    '/tools/:rid/heat',
    async (request) => {
      const { rid } = request.params;
      
      const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
      if (!aigcToolType) {
        return { success: false, error: 'AIGCTool ObjectType not found' };
      }

      const tool = await prisma.objects.findFirst({
        where: { objectTypeId: aigcToolType.id, rid }
      });

      if (!tool) {
        return { success: false, error: 'Tool not found' };
      }

      const props = tool.properties as Record<string, any> || {};
      const viewCount = (props.viewCount as number) || 0;
      const heatScore = Math.min(100, Math.log10(viewCount + 1) * 30);

      let heatLevel = 'low';
      if (heatScore > 70) heatLevel = 'high';
      else if (heatScore > 40) heatLevel = 'medium';

      return {
        success: true,
        data: {
          rid,
          name: props.name || 'Unknown',
          viewCount,
          heatScore: Math.round(heatScore * 100) / 100,
          heatLevel,
          period: request.query.period || 'daily',
          updatedAt: tool.updatedAt,
        },
      };
    }
  );

  fastify.get<{ Querystring: { period?: string; limit?: string } }>(
    '/heat/hot',
    async (request) => {
      const limit = Math.min(parseInt(request.query.limit || '20'), 100);

      const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
      if (!aigcToolType) {
        return { success: false, error: 'AIGCTool ObjectType not found' };
      }

      const tools = await prisma.objects.findMany({
        where: { objectTypeId: aigcToolType.id, status: 'active' },
        orderBy: { updatedAt: 'desc' },
        take: limit * 2,
      });

      const scored = tools
        .map(t => {
          const tProps = t.properties as Record<string, any> || {};
          const viewCount = (tProps.viewCount as number) || 0;
          return {
            rid: t.rid,
            name: tProps.name || 'Unknown',
            slug: tProps.slug || '',
            viewCount,
            heatScore: Math.round(Math.min(100, Math.log10(viewCount + 1) * 30) * 100) / 100,
            developer: tProps.developer || '',
            pricingModel: tProps.pricingModel || 'unknown',
          };
        })
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, limit);

      return {
        success: true,
        data: {
          period: request.query.period || 'daily',
          total: scored.length,
          tools: scored,
          updatedAt: new Date().toISOString(),
        },
      };
    }
  );

  fastify.get<{ Querystring: { limit?: string } }>(
    '/heat/rising',
    async (request) => {
      const limit = Math.min(parseInt(request.query.limit || '10'), 50);

      const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
      if (!aigcToolType) {
        return { success: false, error: 'AIGCTool ObjectType not found' };
      }

      const tools = await prisma.objects.findMany({
        where: { objectTypeId: aigcToolType.id, status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      const rising = tools.map(t => {
        const tProps = t.properties as Record<string, any> || {};
        return {
          rid: t.rid,
          name: tProps.name || 'Unknown',
          slug: tProps.slug || '',
          viewCount: (tProps.viewCount as number) || 0,
          heatScore: 50,
          developer: tProps.developer || '',
          pricingModel: tProps.pricingModel || 'unknown',
        };
      });

      return {
        success: true,
        data: {
          total: rising.length,
          tools: rising,
          updatedAt: new Date().toISOString(),
        },
      };
    }
  );
}

export default eventsRoutes;