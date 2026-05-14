import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

export const errorHandler = fp(async (server: FastifyInstance) => {
  server.setErrorHandler((error, _request, reply) => {
    // Zod validation error
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: 'Validation Error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    // Prisma error
    if (error.code?.startsWith('P')) {
      server.log.error(error, 'Database error');
      return reply.code(500).send({
        error: 'Database Error',
        message: 'An error occurred while accessing the database',
      });
    }

    // Default error
    server.log.error(error, 'Unhandled error');
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  });
});
