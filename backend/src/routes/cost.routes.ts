/**
 * Cost Simulator Routes
 *
 * LLM API 调用成本估算 API
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getCostSimulator } from '../services/llm/cost-simulator.js';

// =============================================================================
// Routes
// =============================================================================

export async function registerCostRoutes(fastify: FastifyInstance) {
  const costSimulator = getCostSimulator();

  // ===========================================================================
  // GET /api/aigc/cost/models - 获取支持的模型列表
  // ===========================================================================
  fastify.get('/cost/models', async (_request: FastifyRequest, reply: FastifyReply) => {
    const models = costSimulator.getSupportedModels();
    return reply.send({
      success: true,
      data: models,
    });
  });

  // ===========================================================================
  // POST /api/aigc/cost/estimate - 估算单次调用成本
  // ===========================================================================
  fastify.post<{
    Body: {
      modelId: string;
      inputText: string;
      expectedOutputTokens: number;
      callsPerDay: number;
      daysPerMonth?: number;
    };
  }>('/cost/estimate', async (request: FastifyRequest<{ Body: {
    modelId: string;
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
    daysPerMonth?: number;
  } }>, reply: FastifyReply) => {
    const { modelId, inputText, expectedOutputTokens, callsPerDay, daysPerMonth } = request.body;

    try {
      const estimate = costSimulator.estimateCost({
        modelId,
        inputText,
        expectedOutputTokens,
        callsPerDay,
        daysPerMonth,
      });

      return reply.send({
        success: true,
        data: estimate,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });

  // ===========================================================================
  // POST /api/aigc/cost/compare - 对比多个模型成本
  // ===========================================================================
  fastify.post<{
    Body: {
      inputText: string;
      expectedOutputTokens: number;
      callsPerDay: number;
      daysPerMonth?: number;
      modelIds?: string[];
    };
  }>('/cost/compare', async (request: FastifyRequest<{ Body: {
    inputText: string;
    expectedOutputTokens: number;
    callsPerDay: number;
    daysPerMonth?: number;
    modelIds?: string[];
  } }>, reply: FastifyReply) => {
    const { inputText, expectedOutputTokens, callsPerDay, daysPerMonth, modelIds } = request.body;

    try {
      const comparison = costSimulator.compareModels({
        inputText,
        expectedOutputTokens,
        callsPerDay,
        daysPerMonth,
        modelIds,
      });

      return reply.send({
        success: true,
        data: comparison,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  });
}
