/**
 * Seed Heat and Ranking Data
 * 
 * 填充热度快照和排名快照数据
 * 用于完善数据完整性
 * 
 * Run: npx tsx src/seed/heat-ranking.seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ToolSeed {
  slug: string;
  rid: string;
  name: string;
  viewCount?: number;
  favoriteCount?: number;
  compareCount?: number;
}

async function main() {
  console.log('Seeding heat snapshots and ranking data...\n');

  const aigcToolType = await prisma.object_types.findUnique({
    where: { apiName: 'AIGCTool' }
  });

  if (!aigcToolType) {
    console.error('ERROR: AIGCTool ObjectType not found');
    await prisma.$disconnect();
    return;
  }

  const tools = await prisma.objects.findMany({
    where: {
      objectTypeId: aigcToolType.id,
      status: 'active'
    },
    select: {
      id: true,
      rid: true,
      properties: true
    }
  });

  console.log(`Found ${tools.length} tools`);

  const periods = ['1h', '24h', '7d', '30d'];
  const rankingTypes = [
    { type: 'composite', perspective: 'default' },
    { type: 'price_performance', perspective: 'value' },
    { type: 'speed', perspective: 'performance' },
    { type: 'quality', perspective: 'default' },
    { type: 'popularity', perspective: 'default' }
  ];

  let heatSnapshotsCreated = 0;
  let rankingSnapshotsCreated = 0;
  let toolRankingHistoryCreated = 0;

  for (const tool of tools) {
    const props = tool.properties as any;
    const name = props.name || 'Unknown';
    const slug = props.slug || tool.id;

    const baseMetrics = {
      viewCount: props.viewCount || Math.floor(Math.random() * 10000) + 100,
      favoriteCount: props.favoriteCount || Math.floor(Math.random() * 500) + 10,
      compareCount: props.compareCount || Math.floor(Math.random() * 200) + 5,
    };

    for (const period of periods) {
      const multiplier = period === '1h' ? 0.1 : period === '24h' ? 0.5 : period === '7d' ? 2 : 5;
      const viewCount = Math.floor(baseMetrics.viewCount * multiplier);
      const eventCount = viewCount + baseMetrics.favoriteCount * 2 + baseMetrics.compareCount * 3;
      const rawScore = Math.min(100, eventCount / 10);
      const heatScore = rawScore * 0.9 + Math.random() * 10;

      const existingSnapshot = await prisma.tool_heat_snapshots.findUnique({
        where: {
          toolRid_period: {
            toolRid: tool.rid,
            period
          }
        }
      });

      if (!existingSnapshot) {
        await prisma.tool_heat_snapshots.create({
          data: {
            id: `heat-${Date.now()}-${slug}-${period}`,
            toolRid: tool.rid,
            period,
            heatScore: Math.round(heatScore * 100) / 100,
            rawScore: Math.round(rawScore * 100) / 100,
            eventCount,
            weightedScore: Math.round(heatScore * 100) / 100,
            decayFactor: 1,
            trend: heatScore > 70 ? 'rising' : heatScore < 30 ? 'falling' : 'stable',
            trendChange: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
            previousScore: Math.round((heatScore * 0.95 + Math.random() * 5) * 100) / 100,
            level: heatScore > 80 ? 'HOT' : heatScore > 50 ? 'WARM' : heatScore > 20 ? 'COOL' : 'FROZEN',
            levelIcon: heatScore > 80 ? '🔥' : heatScore > 50 ? '🌡️' : heatScore > 20 ? '❄️' : '🧊',
            calculatedAt: new Date(),
            updatedAt: new Date(),
          }
        });
        heatSnapshotsCreated++;
      }
    }

    for (const rankingConfig of rankingTypes) {
      const existingSnapshot = await prisma.ranking_snapshots.findFirst({
        where: {
          type: rankingConfig.type,
          perspective: rankingConfig.perspective,
          category: null
        }
      });

      if (!existingSnapshot) {
        const rankings: Array<{
          toolRid: string;
          toolName: string;
          rank: number;
          score: number;
        }> = tools.map((t, index) => {
          const tProps = t.properties as any;
          const baseScore = 50 + Math.random() * 50;
          return {
            toolRid: t.rid,
            toolName: tProps.name || 'Unknown',
            rank: index + 1,
            score: Math.round(baseScore * 100) / 100
          };
        });

        rankings.sort((a, b) => b.score - a.score);
        rankings.forEach((r, i) => r.rank = i + 1);

        await prisma.ranking_snapshots.create({
          data: {
            id: `ranking-${Date.now()}-${rankingConfig.type}-${rankingConfig.perspective}`,
            type: rankingConfig.type,
            perspective: rankingConfig.perspective,
            category: null,
            rankings: rankings.slice(0, 50),
            totalTools: rankings.length,
            avgScore: rankings.reduce((sum, r) => sum + r.score, 0) / rankings.length,
            maxScore: rankings[0]?.score || 0,
            minScore: rankings[rankings.length - 1]?.score || 0,
            weights: {
              performance: 0.4,
              price: 0.3,
              community: 0.3
            },
            explanation: [
              'Based on comprehensive evaluation of tool capabilities',
              'Factors include performance benchmarks, user feedback, and usage metrics'
            ],
            calculatedAt: new Date(),
            updatedAt: new Date(),
          }
        });
        rankingSnapshotsCreated++;
        break;
      }
    }

    const toolRankings = await prisma.ranking_snapshots.findFirst({
      where: { type: 'composite', perspective: 'default', category: null }
    });

    if (toolRankings) {
      const rankings = toolRankings.rankings as any[];
      const rankingEntry = rankings.find((r: any) => r.toolRid === tool.rid);

      if (rankingEntry) {
        await prisma.tool_ranking_history.create({
          data: {
            id: `rank-history-${Date.now()}-${slug}`,
            toolRid: tool.rid,
            type: 'composite',
            perspective: 'default',
            category: null,
            rank: rankingEntry.rank,
            score: rankingEntry.score,
            previousRank: rankingEntry.rank + Math.floor(Math.random() * 5) - 2,
            rankChange: Math.floor(Math.random() * 5) - 2,
            scoreBreakdown: {
              performance: 0.4,
              price: 0.3,
              community: 0.3
            },
            recordedAt: new Date()
          }
        });
        toolRankingHistoryCreated++;
      }
    }

    if (tools.indexOf(tool) % 20 === 0) {
      console.log(`  Progress: ${tools.indexOf(tool) + 1}/${tools.length}`);
    }
  }

  console.log('\n✅ Seed complete:');
  console.log(`   - Heat Snapshots: ${heatSnapshotsCreated} created`);
  console.log(`   - Ranking Snapshots: ${rankingSnapshotsCreated} created`);
  console.log(`   - Tool Ranking History: ${toolRankingHistoryCreated} created`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
