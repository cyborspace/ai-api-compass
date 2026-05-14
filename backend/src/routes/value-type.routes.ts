/**
 * Value Type Validation API Routes
 *
 * 运行时 Value Type constraint 验证端点
 */

import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  validateObjectProperties,
  validateActionParameters,
  createValidationError,
  isValidationError,
  type ConstraintViolation,
} from '../ontology/value-type-validator.js';
import type { OntologyValueType } from '../ontology/types';

export const registerValueTypeRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma: PrismaClient = fastify.prisma;

  // Helper: load value types from DB
  async function loadValueTypes(): Promise<Map<string, OntologyValueType>> {
    const types = await prisma.value_types.findMany();
    const map = new Map<string, OntologyValueType>();
    for (const t of types) {
      map.set(t.apiName, {
        rid: t.rid ?? undefined,
        apiName: t.apiName,
        displayName: t.displayName,
        description: t.description ?? undefined,
        baseType: (t.baseType as any) ?? 'string',
        constraints: (t.constraints as any[]) ?? undefined,
      });
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // POST /api/ontology/validate/object-properties
  // 验证对象属性
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/validate/object-properties',
    {
      schema: {
        tags: ['Ontology', 'Validation'],
        description: 'Validate object properties against Value Type constraints',
        body: {
          type: 'object',
          properties: {
            objectTypeApiName: { type: 'string' },
            properties: { type: 'object' },
          },
          required: ['objectTypeApiName', 'properties'],
        },
      },
    },
    async (request, reply) => {
      const { objectTypeApiName, properties } = request.body as {
        objectTypeApiName: string;
        properties: Record<string, any>;
      };

      const objectType = await prisma.object_types.findUnique({
        where: { apiName: objectTypeApiName },
      });

      if (!objectType) {
        return reply.status(404).send({
          success: false,
          error: `Object Type '${objectTypeApiName}' not found`,
        });
      }

      const propDefs = (objectType.properties as any[]) ?? [];
      const valueTypes = await loadValueTypes();

      const violations = validateObjectProperties(
        properties,
        propDefs.map((p: any) => ({
          apiName: p.apiName || p.name,
          dataType: p.dataType,
          valueTypeApiName: p.valueTypeApiName,
          required: p.required ?? false,
          defaultValue: p.defaultValue,
        })),
        valueTypes
      );

      return reply.send({
        success: violations.length === 0,
        data: {
          valid: violations.length === 0,
          violations,
          objectTypeApiName,
        },
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/ontology/validate/action-parameters
  // 验证 Action 参数
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/validate/action-parameters',
    {
      schema: {
        tags: ['Ontology', 'Validation'],
        description: 'Validate action parameters against Value Type constraints',
        body: {
          type: 'object',
          properties: {
            actionTypeApiName: { type: 'string' },
            parameters: { type: 'object' },
          },
          required: ['actionTypeApiName', 'parameters'],
        },
      },
    },
    async (request, reply) => {
      const { actionTypeApiName, parameters } = request.body as {
        actionTypeApiName: string;
        parameters: Record<string, any>;
      };

      const actionType = await prisma.action_types.findUnique({
        where: { apiName: actionTypeApiName },
      });

      if (!actionType) {
        return reply.status(404).send({
          success: false,
          error: `Action Type '${actionTypeApiName}' not found`,
        });
      }

      const paramDefs = (actionType.parameters as any[]) ?? [];
      const valueTypes = await loadValueTypes();

      const violations = validateActionParameters(
        parameters,
        paramDefs.map((p: any) => ({
          apiName: p.apiName || p.name,
          displayName: p.displayName,
          dataType: p.dataType,
          valueTypeApiName: p.valueTypeApiName,
          required: p.required ?? false,
          defaultValue: p.defaultValue,
        })),
        valueTypes
      );

      return reply.send({
        success: violations.length === 0,
        data: {
          valid: violations.length === 0,
          violations,
          actionTypeApiName,
        },
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/ontology/validate/value
  // 验证单个值
  // ---------------------------------------------------------------------------
  fastify.post(
    '/ontology/validate/value',
    {
      schema: {
        tags: ['Ontology', 'Validation'],
        description: 'Validate a single value against a Value Type',
        body: {
          type: 'object',
          properties: {
            valueTypeApiName: { type: 'string' },
            value: {},
            propertyName: { type: 'string' },
          },
          required: ['valueTypeApiName', 'value'],
        },
      },
    },
    async (request, reply) => {
      const { valueTypeApiName, value, propertyName = 'value' } = request.body as {
        valueTypeApiName: string;
        value: any;
        propertyName?: string;
      };

      const valueType = await prisma.value_types.findUnique({
        where: { apiName: valueTypeApiName },
      });

      if (!valueType) {
        return reply.status(404).send({
          success: false,
          error: `Value Type '${valueTypeApiName}' not found`,
        });
      }

      const { validateWithValueType } = await import('../ontology/value-type-validator.js');
      const violations = validateWithValueType(propertyName, value, {
        rid: valueType.rid ?? undefined,
        apiName: valueType.apiName,
        displayName: valueType.displayName,
        description: valueType.description ?? undefined,
        baseType: (valueType.baseType as any) ?? 'string',
        constraints: (valueType.constraints as any[]) ?? undefined,
      });

      return reply.send({
        success: violations.length === 0,
        data: {
          valid: violations.length === 0,
          violations,
          valueTypeApiName,
          value,
        },
      });
    }
  );
};

export default registerValueTypeRoutes;
