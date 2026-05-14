import type { FastifyInstance } from 'fastify';

export async function registerHealthRoutes(server: FastifyInstance) {
  server.get('/health', async () => {
    const status: Record<string, string> = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      await server.prisma.$queryRaw`SELECT 1`;
      status.database = 'ok';
    } catch {
      status.database = 'error';
      status.status = 'degraded';
    }

    // Check Redis (optional)
    if (server.redis) {
      try {
        await server.redis.ping();
        status.redis = 'ok';
      } catch {
        status.redis = 'error';
      }
    } else {
      status.redis = 'not_configured';
    }

    return status;
  });
}
