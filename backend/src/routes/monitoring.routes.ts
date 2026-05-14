/**
 * Monitoring Routes
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPerformanceMonitor } from '../services/monitoring/performance-monitor.js';

export async function registerMonitoringRoutes(fastify: FastifyInstance) {
  const monitor = getPerformanceMonitor();

  fastify.get('/monitoring/metrics', async (_request: FastifyRequest, reply: FastifyReply) => {
    const metrics = monitor.getCurrentMetrics();
    const history = monitor.getMetricsHistory(60);
    const systemStatus = monitor.getSystemStatus();

    return reply.send({
      success: true,
      data: {
        current: metrics,
        history,
        system: systemStatus,
      },
    });
  });

  fastify.get('/monitoring/queries', async (_request: FastifyRequest, reply: FastifyReply) => {
    const queries = monitor.getQueryMetrics();

    return reply.send({
      success: true,
      data: queries,
    });
  });

  fastify.get('/monitoring/slow-queries', async (_request: FastifyRequest, reply: FastifyReply) => {
    const slowQueries = monitor.getSlowQueries();

    return reply.send({
      success: true,
      data: slowQueries,
    });
  });
}
