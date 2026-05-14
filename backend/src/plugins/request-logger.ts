import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export const requestLogger = fp(async (server: FastifyInstance) => {
  server.addHook('onRequest', async (request) => {
    (request as any).startTime = Date.now();
  });

  server.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now());
    
    server.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      ip: request.ip,
    }, 'request completed');

    // Log slow requests (> 1s)
    if (duration > 1000) {
      server.log.warn({
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
      }, 'slow request detected');
    }
  });
});
