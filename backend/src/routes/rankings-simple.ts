import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type RankingType = 'composite' | 'price_performance' | 'speed' | 'quality' | 'popularity' | 'rising';
type PerspectiveType = 'default' | 'performance' | 'value' | 'community';

const RANKING_TYPE_NAMES: Record<RankingType, string> = {
  composite: '综合榜',
  price_performance: '性价比榜',
  speed: '速度榜',
  quality: '质量榜',
  popularity: '热度榜',
  rising: '新兴榜',
};

export async function rankingsRoutes(fastify: FastifyInstance) {

  fastify.get('/rankings/types', async () => {
    const types: Array<{ type: RankingType; name: string; description: string }> = [
      { type: 'composite', name: RANKING_TYPE_NAMES.composite, description: '综合考量性能、价格、社区活跃度等多维度指标' },
      { type: 'price_performance', name: RANKING_TYPE_NAMES.price_performance, description: '基于性价比的排名' },
      { type: 'speed', name: RANKING_TYPE_NAMES.speed, description: '基于响应速度的排名' },
      { type: 'quality', name: RANKING_TYPE_NAMES.quality, description: '基于质量评分的排名' },
      { type: 'popularity', name: RANKING_TYPE_NAMES.popularity, description: '基于热度和使用量的排名' },
      { type: 'rising', name: RANKING_TYPE_NAMES.rising, description: '近期上升较快的工具' },
    ];
    return { success: true, data: types };
  });

  fastify.get('/rankings/perspectives', async () => {
    const perspectives = [
      { type: 'default', name: '默认视角', description: '平衡各项指标' },
      { type: 'performance', name: '性能优先', description: '更看重性能指标' },
      { type: 'value', name: '性价比优先', description: '更看重价格因素' },
      { type: 'community', name: '社区优先', description: '更看重社区活跃度' },
    ];
    return { success: true, data: perspectives };
  });

  fastify.get<{ Params: { type: string }; Querystring: { perspective?: string; category?: string; limit?: string } }>(
    '/rankings/:type',
    async (request) => {
      const { type } = request.params;
      const { perspective = 'default', category, limit = '50' } = request.query;
      const limitNum = Math.min(parseInt(limit) || 50, 100);

      const validTypes: RankingType[] = ['composite', 'price_performance', 'speed', 'quality', 'popularity', 'rising'];
      if (!validTypes.includes(type as RankingType)) {
        return { success: false, error: 'Invalid ranking type' };
      }

      const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
      if (!aigcToolType) {
        return { success: false, error: 'AIGCTool ObjectType not found' };
      }

      let tools = await prisma.objects.findMany({
        where: { objectTypeId: aigcToolType.id, status: 'active' },
        take: 200,
      });

      tools = tools.map(t => ({ ...t, properties: (t.properties || {}) as Record<string, any> }));

      let scored = tools.map(t => {
        const p = t.properties as Record<string, any>;
        let score = 50;

        const viewCount = (p.viewCount as number) || 0;
        const rating = (p.averageRating as number) || 0;
        const inputPrice = (p.inputPrice as number) || 0;
        const contextWindow = (p.contextWindow as number) || 0;
        const capabilities = (p.capabilities as string[]) || [];

        switch (type) {
          case 'popularity':
            score = Math.min(100, viewCount / 100);
            break;
          case 'price_performance':
            score = inputPrice > 0 ? Math.max(0, 100 - inputPrice * 10) + rating : 70 + rating;
            break;
          case 'quality':
            score = rating * 20;
            break;
          case 'speed':
            score = (capabilities.includes('streaming') ? 50 : 0) + (contextWindow > 32000 ? 30 : 0) + rating * 2;
            break;
          case 'composite':
          default:
            score = Math.min(100, viewCount / 50 + rating * 15 + (contextWindow > 32000 ? 20 : 0) + (inputPrice > 0 ? 0 : 10));
            break;
        }

        return { ...t, score: Math.round(score * 100) / 100 };
      });

      scored.sort((a, b) => b.score - a.score);
      scored = scored.slice(0, limitNum);

      return {
        success: true,
        data: {
          type,
          perspective,
          total: scored.length,
          entries: scored.map((t, index) => {
            const tp = t.properties as Record<string, any>;
            return {
              rank: index + 1,
              rid: t.rid,
              name: tp?.name || tp?.slug || 'Unknown',
              slug: tp?.slug || '',
              score: t.score,
              pricingModel: tp?.pricingModel || 'unknown',
              contextWindow: tp?.contextWindow || 0,
              developer: tp?.developer || '',
              capabilities: tp?.capabilities || [],
              averageRating: tp?.averageRating || 0,
              trend: 'stable' as const,
            };
          }),
          updatedAt: new Date().toISOString(),
          weights: { quality: 0.4, popularity: 0.3, price: 0.2, speed: 0.1 },
          explanation: [
            `排名类型: ${RANKING_TYPE_NAMES[type as RankingType] || type}`,
            `计算视角: ${perspective}`,
          ],
        },
      };
    }
  );
}

export default rankingsRoutes;
