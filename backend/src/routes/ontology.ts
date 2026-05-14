import type { FastifyPluginAsync } from 'fastify';
import { OntologyRepository } from '../repositories/ontology.js';
import { PrismaClient } from '@prisma/client';

export const registerOntologyRoutes: FastifyPluginAsync = async (fastify) => {
  const prisma = fastify.prisma;

  // ═══════════════════════════════════════════════════════════════════════
  // Ontology Routes (新增)
  // ═══════════════════════════════════════════════════════════════════════

  // List all ontologies
  fastify.get(
    '/ontologies',
    {
      schema: {
        tags: ['Ontology'],
        description: 'List all ontologies',
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      // 返回所有 ObjectType 作为 ontology 列表
      // 实际产品中可能有独立的 Ontology 表
      const objectTypes = await prisma.object_types.findMany({
        orderBy: { displayName: 'asc' },
      });
      
      // 按 rid 归类（同一个 ontology 下可能有多个 objectTypes）
      const ontologyMap = new Map<string, any>();
      
      for (const ot of objectTypes) {
        const baseRid = ot.rid.split('.')[0] + '.' + ot.rid.split('.')[1];
        if (!ontologyMap.has(baseRid)) {
          ontologyMap.set(baseRid, {
            rid: baseRid,
            displayName: 'AI API Compass Ontology',
            description: 'AI模型对比平台的 Ontology',
            objectTypesCount: 0,
            linkTypesCount: 0,
            actionTypesCount: 0,
            functionsCount: 0,
            status: 'active',
            createdAt: ot.createdAt,
            updatedAt: ot.updatedAt,
          });
        }
        const ont = ontologyMap.get(baseRid);
        ont.objectTypesCount++;
      }
      
      // 获取 link types 数量
      const linkTypesCount = await prisma.link_types.count();
      const actionTypesCount = await prisma.action_types.count();
      const functionsCount = await prisma.functions.count();
      
      const ontologies = Array.from(ontologyMap.values()).map(o => ({
        ...o,
        linkTypesCount,
        actionTypesCount,
        functionsCount,
      }));
      
      return reply.send({ data: ontologies });
    },
  );

  // Get single ontology
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Get a single ontology by RID',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
          },
          required: ['ontologyRid'],
        },
      },
    },
    async (req, reply) => {
      const objectTypes = await prisma.object_types.findMany({
        orderBy: { displayName: 'asc' },
      });
      
      const linkTypesCount = await prisma.link_types.count();
      const actionTypesCount = await prisma.action_types.count();
      const functionsCount = await prisma.functions.count();
      
      return reply.send({
        data: {
          rid: req.params.ontologyRid,
          displayName: 'AI API Compass Ontology',
          description: 'AIGC领域的人工智能工具Ontology，包含工具、分类、提供商等对象类型',
          objectTypesCount: objectTypes.length,
          linkTypesCount,
          actionTypesCount,
          functionsCount,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },
  );

  // Create ontology
  fastify.post(
    '/ontologies',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Create a new ontology',
        body: {
          type: 'object',
          properties: {
            apiName: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['displayName'],
        },
      },
    },
    async (req, reply) => {
      const body = req.body as { apiName?: string; displayName: string; description?: string };
      const apiName = body.apiName || body.displayName.replace(/[^a-zA-Z0-9]/g, '');
      
      // 创建默认的 ontology 结构
      const ontData = {
        rid: `ri.ontology.${apiName.toLowerCase()}`,
        displayName: body.displayName,
        description: body.description || '',
        status: 'active',
      };
      
      return reply.status(201).send({ data: ontData });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ObjectType Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List object types
  fastify.get<{
    Params: { ontologyRid: string };
    Querystring: { status?: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes',
    {
      schema: {
        tags: ['Ontology'],
        description: 'List all object types in the ontology',
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status (active, experimental, deprecated)' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const where = req.query.status ? { status: req.query.status } : {};
      const objectTypes = await prisma.object_types.findMany({
        where,
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: objectTypes });
    },
  );

  // Get single object type
  fastify.get<{
    Params: { ontologyRid: string; objectTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Get a single object type by apiName',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            objectTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'objectTypeApiName'],
        },
      },
    },
    async (req, reply) => {
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
        include: {
          link_types_link_types_sourceObjectTypeIdToobject_types: { include: { } },
          link_types_link_types_targetObjectTypeIdToobject_types: { include: { } },
        },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      return reply.send({ data: objectType });
    },
  );

  // Create object type
  fastify.post<{
    Params: { ontologyRid: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/objectTypes',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Create a new object type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
          },
          required: ['ontologyRid'],
        },
        body: {
          type: 'object',
          properties: {
            apiName: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            primaryKeys: { type: 'array', items: { type: 'string' } },
            titleKeys: { type: 'array', items: { type: 'string' } },
            properties: { type: 'array' },
            status: { type: 'string' },
          },
          required: ['apiName', 'displayName'],
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const rid = `ri.ontology.main.object-type.${body.apiName}`;
      
      try {
        const objectType = await prisma.object_types.create({
          data: {
            id: crypto.randomUUID(),
            rid,
            apiName: body.apiName,
            displayName: body.displayName,
            description: body.description,
            primaryKeys: body.primaryKeys || [],
            titleKeys: body.titleKeys || [],
            properties: body.properties || [],
            status: body.status || 'active',
            updatedAt: new Date(),
          },
        });
        return reply.status(201).send({ data: objectType });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(400).send({
            error: { code: 'DUPLICATE', message: `ObjectType '${body.apiName}' already exists` },
          });
        }
        throw err;
      }
    },
  );

  // Update object type
  fastify.put<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Update an object type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            objectTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'objectTypeApiName'],
        },
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            description: { type: 'string' },
            primaryKeys: { type: 'array', items: { type: 'string' } },
            titleKeys: { type: 'array', items: { type: 'string' } },
            properties: { type: 'array' },
            status: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const updated = await prisma.object_types.update({
        where: { apiName: req.params.objectTypeApiName },
        data: {
          displayName: body.displayName,
          description: body.description,
          primaryKeys: body.primaryKeys,
          titleKeys: body.titleKeys,
          properties: body.properties,
          status: body.status,
        },
      });
      return reply.send({ data: updated });
    },
  );

  // Delete object type
  fastify.delete<{
    Params: { ontologyRid: string; objectTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Delete an object type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            objectTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'objectTypeApiName'],
        },
      },
    },
    async (req, reply) => {
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      await prisma.object_types.delete({ where: { apiName: req.params.objectTypeApiName } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Properties Routes (新增)
  // ═══════════════════════════════════════════════════════════════════════

  // Add property to object type
  fastify.post<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/properties',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Add a property to an object type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            objectTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'objectTypeApiName'],
        },
        body: {
          type: 'object',
          properties: {
            apiName: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            baseType: { type: 'string' },
            defaultValue: { type: 'string' },
            nullable: { type: 'boolean' },
            searchable: { type: 'boolean' },
            filterable: { type: 'boolean' },
            sortable: { type: 'boolean' },
          },
          required: ['apiName', 'displayName', 'baseType'],
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const currentProps = Array.isArray(objectType.properties) ? objectType.properties : [];
      
      // 检查是否已存在
      if (currentProps.some((p: any) => p.apiName === body.apiName)) {
        return reply.code(400).send({
          error: { code: 'DUPLICATE', message: `Property '${body.apiName}' already exists` },
        });
      }
      
      const newProp = {
        apiName: body.apiName,
        displayName: body.displayName,
        description: body.description,
        baseType: body.baseType,
        defaultValue: body.defaultValue,
        nullable: body.nullable ?? true,
        searchable: body.searchable ?? true,
        filterable: body.filterable ?? true,
        sortable: body.sortable ?? true,
      };
      
      const updated = await prisma.object_types.update({
        where: { apiName: req.params.objectTypeApiName },
        data: {
          properties: [...currentProps, newProp],
          version: { increment: 1 },
        },
      });
      
      return reply.status(201).send({ data: newProp });
    },
  );

  // Remove property from object type
  fastify.delete<{
    Params: { ontologyRid: string; objectTypeApiName: string; propertyApiName: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/properties/:propertyApiName',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Remove a property from an object type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            objectTypeApiName: { type: 'string' },
            propertyApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'objectTypeApiName', 'propertyApiName'],
        },
      },
    },
    async (req, reply) => {
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const currentProps = Array.isArray(objectType.properties) ? objectType.properties : [];
      const filteredProps = currentProps.filter((p: any) => p.apiName !== req.params.propertyApiName);
      
      await prisma.object_types.update({
        where: { apiName: req.params.objectTypeApiName },
        data: {
          properties: filteredProps,
          version: { increment: 1 },
        },
      });
      
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ValueType Routes (新增)
  // ═══════════════════════════════════════════════════════════════════════

  // List value types
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/valueTypes',
    {
      schema: {
        tags: ['ValueTypes'],
        description: 'List all value types',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
          },
          required: ['ontologyRid'],
        },
      },
    },
    async (req, reply) => {
      const valueTypes = await prisma.value_types.findMany({
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: valueTypes });
    },
  );

  // Get single value type
  fastify.get<{
    Params: { ontologyRid: string; valueTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/valueTypes/:valueTypeApiName',
    {
      schema: {
        tags: ['ValueTypes'],
        description: 'Get a value type by apiName',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            valueTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'valueTypeApiName'],
        },
      },
    },
    async (req, reply) => {
      const valueType = await prisma.value_types.findUnique({
        where: { apiName: req.params.valueTypeApiName },
      });
      if (!valueType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ValueType '${req.params.valueTypeApiName}' not found` },
        });
      }
      return reply.send({ data: valueType });
    },
  );

  // Create value type
  fastify.post<{
    Params: { ontologyRid: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/valueTypes',
    {
      schema: {
        tags: ['ValueTypes'],
        description: 'Create a value type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
          },
          required: ['ontologyRid'],
        },
        body: {
          type: 'object',
          properties: {
            apiName: { type: 'string' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            baseType: { type: 'string' },
            constraints: { type: 'object' },
          },
          required: ['apiName', 'displayName', 'baseType'],
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const rid = `ri.ontology.main.value-type.${body.apiName}`;
      
      try {
        const valueType = await prisma.value_types.create({
          data: {
            id: crypto.randomUUID(),
            rid,
            apiName: body.apiName,
            displayName: body.displayName,
            description: body.description,
            baseType: body.baseType,
            constraints: body.constraints || {},
            updatedAt: new Date(),
          },
        });
        return reply.status(201).send({ data: valueType });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(400).send({
            error: { code: 'DUPLICATE', message: `ValueType '${body.apiName}' already exists` },
          });
        }
        throw err;
      }
    },
  );

  // Update value type
  fastify.put<{
    Params: { ontologyRid: string; valueTypeApiName: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/valueTypes/:valueTypeApiName',
    {
      schema: {
        tags: ['ValueTypes'],
        description: 'Update a value type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            valueTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'valueTypeApiName'],
        },
        body: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            description: { type: 'string' },
            baseType: { type: 'string' },
            constraints: { type: 'object' },
            status: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const valueType = await prisma.value_types.findUnique({
        where: { apiName: req.params.valueTypeApiName },
      });
      if (!valueType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ValueType '${req.params.valueTypeApiName}' not found` },
        });
      }
      
      const updated = await prisma.value_types.update({
        where: { apiName: req.params.valueTypeApiName },
        data: {
          displayName: body.displayName,
          description: body.description,
          baseType: body.baseType,
          constraints: body.constraints,
          status: body.status,
        },
      });
      return reply.send({ data: updated });
    },
  );

  // Delete value type
  fastify.delete<{
    Params: { ontologyRid: string; valueTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/valueTypes/:valueTypeApiName',
    {
      schema: {
        tags: ['ValueTypes'],
        description: 'Delete a value type',
        params: {
          type: 'object',
          properties: {
            ontologyRid: { type: 'string' },
            valueTypeApiName: { type: 'string' },
          },
          required: ['ontologyRid', 'valueTypeApiName'],
        },
      },
    },
    async (req, reply) => {
      const valueType = await prisma.value_types.findUnique({
        where: { apiName: req.params.valueTypeApiName },
      });
      if (!valueType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ValueType '${req.params.valueTypeApiName}' not found` },
        });
      }
      await prisma.value_types.delete({ where: { apiName: req.params.valueTypeApiName } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Interface Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List interfaces
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/interfaces',
    {
      schema: {
        tags: ['Interfaces'],
        description: 'List all interfaces',
      },
    },
    async (req, reply) => {
      const interfaces = await prisma.interfaces.findMany({
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: interfaces });
    },
  );

  // Get single interface
  fastify.get<{
    Params: { ontologyRid: string; interfaceApiName: string };
  }>(
    '/ontologies/:ontologyRid/interfaces/:interfaceApiName',
    {
      schema: {
        tags: ['Interfaces'],
        description: 'Get an interface by apiName',
      },
    },
    async (req, reply) => {
      const iface = await prisma.interfaces.findUnique({
        where: { apiName: req.params.interfaceApiName },
      });
      if (!iface) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Interface '${req.params.interfaceApiName}' not found` },
        });
      }
      return reply.send({ data: iface });
    },
  );

  // Create interface
  fastify.post<{
    Params: { ontologyRid: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/interfaces',
    {
      schema: {
        tags: ['Interfaces'],
        description: 'Create an interface',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      const rid = `ri.ontology.main.interface.${body.apiName}`;
      
      try {
        const iface = await prisma.interfaces.create({
          data: {
            id: crypto.randomUUID(),
            rid,
            apiName: body.apiName,
            displayName: body.displayName,
            description: body.description,
            status: body.status || 'experimental',
            icon: body.icon,
            color: body.color,
            sharedProperties: body.sharedProperties || [],
            interfaceLinkTypes: body.interfaceLinkTypes || [],
            extendedInterfaces: body.extendedInterfaces || [],
            updatedAt: new Date(),
          },
        });
        return reply.status(201).send({ data: iface });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(400).send({
            error: { code: 'DUPLICATE', message: `Interface '${body.apiName}' already exists` },
          });
        }
        throw err;
      }
    },
  );

  // Delete interface
  fastify.delete<{
    Params: { ontologyRid: string; interfaceApiName: string };
  }>(
    '/ontologies/:ontologyRid/interfaces/:interfaceApiName',
    {
      schema: {
        tags: ['Interfaces'],
        description: 'Delete an interface',
      },
    },
    async (req, reply) => {
      const iface = await prisma.interfaces.findUnique({
        where: { apiName: req.params.interfaceApiName },
      });
      if (!iface) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Interface '${req.params.interfaceApiName}' not found` },
        });
      }
      await prisma.interfaces.delete({ where: { apiName: req.params.interfaceApiName } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // LinkType Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List link types
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/linkTypes',
    {
      schema: {
        tags: ['Links'],
        description: 'List all link types',
      },
    },
    async (req, reply) => {
      const linkTypes = await prisma.link_types.findMany({
        include: {
          },
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: linkTypes });
    },
  );

  // Get single link type
  fastify.get<{
    Params: { ontologyRid: string; linkTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/linkTypes/:linkTypeApiName',
    {
      schema: {
        tags: ['Links'],
        description: 'Get a link type by apiName',
      },
    },
    async (req, reply) => {
      const linkType = await prisma.link_types.findUnique({
        where: { apiName: req.params.linkTypeApiName },
        include: {
          links: { take: 10 },
        },
      });
      if (!linkType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `LinkType '${req.params.linkTypeApiName}' not found` },
        });
      }
      return reply.send({ data: linkType });
    },
  );

  // Create link type
  fastify.post<{
    Params: { ontologyRid: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/linkTypes',
    {
      schema: {
        tags: ['Links'],
        description: 'Create a link type',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      
      const sourceObjectType = await prisma.object_types.findUnique({
        where: { apiName: body.sourceObjectTypeApiName },
      });
      const targetObjectType = await prisma.object_types.findUnique({
        where: { apiName: body.targetObjectTypeApiName },
      });
      
      if (!sourceObjectType || !targetObjectType) {
        return reply.code(400).send({
          error: { code: 'INVALID', message: 'Source or target object type not found' },
        });
      }
      
      try {
        const linkType = await prisma.link_types.create({
          data: {
            id: crypto.randomUUID(),
            rid: `ri.ontology.main.link-type.${body.apiName}`,
            apiName: body.apiName,
            displayName: body.displayName,
            description: body.description,
            status: body.status || 'active',
            visibility: body.visibility || 'prominent',
            sourceObjectTypeId: sourceObjectType.id,
            targetObjectTypeId: targetObjectType.id,
            cardinality: body.cardinality || 'MANY_TO_MANY',
            foreignKeyProperty: body.foreignKeyProperty,
            propertyDefinitions: body.propertyDefinitions || [],
            updatedAt: new Date(),
          },
        });
        return reply.status(201).send({ data: linkType });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(400).send({
            error: { code: 'DUPLICATE', message: `LinkType '${body.apiName}' already exists` },
          });
        }
        throw err;
      }
    },
  );

  // Delete link type
  fastify.delete<{
    Params: { ontologyRid: string; linkTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/linkTypes/:linkTypeApiName',
    {
      schema: {
        tags: ['Links'],
        description: 'Delete a link type',
      },
    },
    async (req, reply) => {
      const linkType = await prisma.link_types.findUnique({
        where: { apiName: req.params.linkTypeApiName },
      });
      if (!linkType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `LinkType '${req.params.linkTypeApiName}' not found` },
        });
      }
      await prisma.link_types.delete({ where: { apiName: req.params.linkTypeApiName } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // ActionType Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List action types
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/actionTypes',
    {
      schema: {
        tags: ['Actions'],
        description: 'List all action types',
      },
    },
    async (req, reply) => {
      const actionTypes = await prisma.action_types.findMany({
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: actionTypes });
    },
  );

  // Get single action type
  fastify.get<{
    Params: { ontologyRid: string; actionTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/actionTypes/:actionTypeApiName',
    {
      schema: {
        tags: ['Actions'],
        description: 'Get an action type by apiName',
      },
    },
    async (req, reply) => {
      const actionType = await prisma.action_types.findUnique({
        where: { apiName: req.params.actionTypeApiName },
        include: {
          actions: { take: 10, orderBy: { createdAt: 'desc' } },
        },
      });
      if (!actionType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ActionType '${req.params.actionTypeApiName}' not found` },
        });
      }
      return reply.send({ data: actionType });
    },
  );

  // Create action type
  fastify.post<{
    Params: { ontologyRid: string };
    Body: any;
  }>(
    '/ontologies/:ontologyRid/actionTypes',
    {
      schema: {
        tags: ['Actions'],
        description: 'Create an action type',
      },
    },
    async (req, reply) => {
      const body = req.body as any;
      
      try {
        const actionType = await prisma.action_types.create({
          data: {
            id: crypto.randomUUID(),
            rid: `ri.ontology.main.action-type.${body.apiName}`,
            apiName: body.apiName,
            displayName: body.displayName,
            description: body.description,
            status: body.status || 'active',
            applicableObjectTypes: body.applicableObjectTypes || [],
            parameters: body.parameters || [],
            rules: body.rules || [],
            submissionCriteria: body.submissionCriteria || [],
            sideEffects: body.sideEffects || [],
            permissions: body.permissions || {},
            updatedAt: new Date(),
          },
        });
        return reply.status(201).send({ data: actionType });
      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.code(400).send({
            error: { code: 'DUPLICATE', message: `ActionType '${body.apiName}' already exists` },
          });
        }
        throw err;
      }
    },
  );

  // Delete action type
  fastify.delete<{
    Params: { ontologyRid: string; actionTypeApiName: string };
  }>(
    '/ontologies/:ontologyRid/actionTypes/:actionTypeApiName',
    {
      schema: {
        tags: ['Actions'],
        description: 'Delete an action type',
      },
    },
    async (req, reply) => {
      const actionType = await prisma.action_types.findUnique({
        where: { apiName: req.params.actionTypeApiName },
      });
      if (!actionType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ActionType '${req.params.actionTypeApiName}' not found` },
        });
      }
      await prisma.action_types.delete({ where: { apiName: req.params.actionTypeApiName } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Function Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List functions
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/functions',
    {
      schema: {
        tags: ['Functions'],
        description: 'List all functions',
      },
    },
    async (req, reply) => {
      const functions = await prisma.functions.findMany({
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: functions });
    },
  );

  // Get single function
  fastify.get<{
    Params: { ontologyRid: string; functionApiName: string };
  }>(
    '/ontologies/:ontologyRid/functions/:functionApiName',
    {
      schema: {
        tags: ['Functions'],
        description: 'Get a function by apiName',
      },
    },
    async (req, reply) => {
      const func = await prisma.functions.findUnique({
        where: { apiName: req.params.functionApiName },
      });
      if (!func) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Function '${req.params.functionApiName}' not found` },
        });
      }
      return reply.send({ data: func });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // SharedProperty Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List shared properties
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/sharedProperties',
    {
      schema: {
        tags: ['SharedProperties'],
        description: 'List all shared properties',
      },
    },
    async (req, reply) => {
      const sharedProperties = await prisma.shared_properties.findMany({
        orderBy: { displayName: 'asc' },
      });
      return reply.send({ data: sharedProperties });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Groups Routes
  // ═══════════════════════════════════════════════════════════════════════

  // Get all unique groups from object types
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/groups',
    {
      schema: {
        tags: ['Groups'],
        description: 'List all groups with their object type counts',
      },
    },
    async (req, reply) => {
      const objectTypes = await prisma.object_types.findMany({
        where: { status: 'active' },
        select: { apiName: true, displayName: true, groups: true },
      });
      
      const groupMap = new Map<string, { apiName: string; displayName: string; objectTypes: string[] }>();
      
      for (const ot of objectTypes) {
        let groups: Array<{ apiName: string; displayName: string }> = [];
        try {
          groups = typeof ot.groups === 'string' ? JSON.parse(ot.groups) : (ot.groups || []);
        } catch {
          groups = [];
        }
        
        for (const group of groups) {
          if (!groupMap.has(group.apiName)) {
            groupMap.set(group.apiName, {
              apiName: group.apiName,
              displayName: group.displayName,
              objectTypes: [],
            });
          }
          groupMap.get(group.apiName)!.objectTypes.push(ot.apiName);
        }
      }
      
      const groups = Array.from(groupMap.values()).map(g => ({
        ...g,
        objectTypeCount: g.objectTypes.length,
      }));
      
      return reply.send({ data: groups });
    },
  );

  // Update object type groups
  fastify.put<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Body: { groups: Array<{ apiName: string; displayName: string }> };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/groups',
    {
      schema: {
        tags: ['Groups'],
        description: 'Update object type groups',
      },
    },
    async (req, reply) => {
      const { groups } = req.body;
      
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const updated = await prisma.object_types.update({
        where: { apiName: req.params.objectTypeApiName },
        data: {
          groups: groups || [],
          updatedAt: new Date(),
        },
      });
      
      return reply.send({ data: { groups: updated.groups as any[] } });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Full Metadata Route (新增)
  // ═══════════════════════════════════════════════════════════════════════

  // Get full ontology metadata
  fastify.get<{
    Params: { ontologyRid: string };
  }>(
    '/ontologies/:ontologyRid/fullMetadata',
    {
      schema: {
        tags: ['Ontology'],
        description: 'Get complete ontology metadata snapshot',
      },
    },
    async (req, reply) => {
      const [objectTypes, linkTypes, actionTypes, functions, interfaces, valueTypes, sharedProperties] = await Promise.all([
        prisma.object_types.findMany({ orderBy: { displayName: 'asc' } }),
        prisma.link_types.findMany({
          include: { },
          orderBy: { displayName: 'asc' },
        }),
        prisma.action_types.findMany({ orderBy: { displayName: 'asc' } }),
        prisma.functions.findMany({ orderBy: { displayName: 'asc' } }),
        prisma.interfaces.findMany({ orderBy: { displayName: 'asc' } }),
        prisma.value_types.findMany({ orderBy: { displayName: 'asc' } }),
        prisma.shared_properties.findMany({ orderBy: { displayName: 'asc' } }),
      ]);
      
      return reply.send({
        data: {
          rid: req.params.ontologyRid,
          displayName: 'AI API Compass Ontology',
          description: 'AI模型对比平台的 Ontology',
          version: '1.0.0',
          objectTypes,
          linkTypes,
          actionTypes,
          functions,
          interfaces,
          valueTypes,
          sharedProperties,
          statistics: {
            objectTypesCount: objectTypes.length,
            linkTypesCount: linkTypes.length,
            actionTypesCount: actionTypes.length,
            functionsCount: functions.length,
            interfacesCount: interfaces.length,
            valueTypesCount: valueTypes.length,
            sharedPropertiesCount: sharedProperties.length,
          },
        },
      });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Object Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List objects by type
  fastify.get<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Querystring: { limit?: string; offset?: string; where?: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/objects',
    {
      schema: {
        tags: ['Objects'],
        description: 'List objects of a specific object type',
      },
    },
    async (req, reply) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const [objects, total] = await Promise.all([
        prisma.objects.findMany({
          where: { objectTypeId: objectType.id },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.objects.count({ where: { objectTypeId: objectType.id } }),
      ]);
      
      return reply.send({ data: objects, total });
    },
  );

  // Get single object
  fastify.get<{
    Params: { ontologyRid: string; objectTypeApiName: string; objectRid: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/objects/:objectRid',
    {
      schema: {
        tags: ['Objects'],
        description: 'Get a single object with its links',
      },
    },
    async (req, reply) => {
      const object = await prisma.objects.findFirst({
        where: { rid: req.params.objectRid },
        include: {
          object_types: true,
          links_links_sourceObjectIdToobjects: { include: { objects_links_targetObjectIdToobjects: { include: { object_types: true } }, link_types: true } },
          links_links_targetObjectIdToobjects: { include: { objects_links_sourceObjectIdToobjects: { include: { object_types: true } }, link_types: true } },
        },
      });
      if (!object) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Object '${req.params.objectRid}' not found` },
        });
      }
      return reply.send({ data: object });
    },
  );

  // Create object
  fastify.post<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Body: { properties?: Record<string, any>; rid?: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/objects',
    {
      schema: {
        tags: ['Objects'],
        description: 'Create a new object',
      },
    },
    async (req, reply) => {
      const body = req.body as { properties?: Record<string, any>; rid?: string };
      const properties = body.properties || body;
      
      const objectType = await prisma.object_types.findUnique({
        where: { apiName: req.params.objectTypeApiName },
      });
      if (!objectType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `ObjectType '${req.params.objectTypeApiName}' not found` },
        });
      }
      
      const object = await prisma.objects.create({
        data: {
          id: crypto.randomUUID(),
          objectTypeId: objectType.id,
          rid: body.rid || undefined,
          properties: properties as any,
          status: 'active',
          updatedAt: new Date(),
        },
        include: { object_types: true },
      });
      
      return reply.status(201).send({ data: object });
    },
  );

  // Update object
  fastify.put<{
    Params: { ontologyRid: string; objectTypeApiName: string; objectRid: string };
    Body: { properties: Record<string, any> };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/objects/:objectRid',
    {
      schema: {
        tags: ['Objects'],
        description: 'Update an object\'s properties',
      },
    },
    async (req, reply) => {
      const { properties } = req.body as { properties: Record<string, any> };
      
      const object = await prisma.objects.findFirst({
        where: { rid: req.params.objectRid },
      });
      if (!object) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Object '${req.params.objectRid}' not found` },
        });
      }
      
      const updated = await prisma.objects.update({
        where: { id: object.id },
        data: { properties },
        include: { object_types: true },
      });
      
      return reply.send({ data: updated });
    },
  );

  // Delete object
  fastify.delete<{
    Params: { ontologyRid: string; objectTypeApiName: string; objectRid: string };
  }>(
    '/ontologies/:ontologyRid/objectTypes/:objectTypeApiName/objects/:objectRid',
    {
      schema: {
        tags: ['Objects'],
        description: 'Delete an object',
      },
    },
    async (req, reply) => {
      const object = await prisma.objects.findFirst({
        where: { rid: req.params.objectRid },
      });
      if (!object) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Object '${req.params.objectRid}' not found` },
        });
      }
      await prisma.objects.delete({ where: { id: object.id } });
      return reply.status(204).send();
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Link Routes
  // ═══════════════════════════════════════════════════════════════════════

  // List links by link type
  fastify.get<{
    Params: { ontologyRid: string; linkTypeApiName: string };
    Querystring: { limit?: string; offset?: string };
  }>(
    '/ontologies/:ontologyRid/linkTypes/:linkTypeApiName/links',
    {
      schema: {
        tags: ['Links'],
        description: 'List links of a specific link type',
      },
    },
    async (req, reply) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      
      const linkType = await prisma.link_types.findUnique({
        where: { apiName: req.params.linkTypeApiName },
      });
      if (!linkType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `LinkType '${req.params.linkTypeApiName}' not found` },
        });
      }
      
      const [links, total] = await Promise.all([
        prisma.links.findMany({
          where: { linkTypeId: linkType.id },
          include: {
            objects_links_sourceObjectIdToobjects: { include: { object_types: true } },
            objects_links_targetObjectIdToobjects: { include: { object_types: true } },
          },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.links.count({ where: { linkTypeId: linkType.id } }),
      ]);
      
      return reply.send({ data: links, total });
    },
  );

  // Create link
  fastify.post<{
    Params: { ontologyRid: string; linkTypeApiName: string };
    Body: { sourceObjectRid: string; targetObjectRid: string; properties?: Record<string, any> };
  }>(
    '/ontologies/:ontologyRid/linkTypes/:linkTypeApiName/links',
    {
      schema: {
        tags: ['Links'],
        description: 'Create a new link between two objects',
      },
    },
    async (req, reply) => {
      const { sourceObjectRid, targetObjectRid, properties } = req.body as {
        sourceObjectRid: string;
        targetObjectRid: string;
        properties?: Record<string, any>;
      };
      
      const sourceObject = await prisma.objects.findFirst({ where: { rid: sourceObjectRid } });
      const targetObject = await prisma.objects.findFirst({ where: { rid: targetObjectRid } });
      
      if (!sourceObject || !targetObject) {
        return reply.code(400).send({
          error: { code: 'INVALID', message: 'Source or target object not found' },
        });
      }
      
      const linkType = await prisma.link_types.findUnique({
        where: { apiName: req.params.linkTypeApiName },
      });
      if (!linkType) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `LinkType '${req.params.linkTypeApiName}' not found` },
        });
      }
      
      const link = await prisma.links.create({
        data: {
          id: crypto.randomUUID(),
          linkTypeId: linkType.id,
          sourceObjectId: sourceObject.id,
          targetObjectId: targetObject.id,
          properties: (properties || {}) as any,
          updatedAt: new Date(),
        },
        include: {
          objects_links_sourceObjectIdToobjects: { include: { object_types: true } },
          objects_links_targetObjectIdToobjects: { include: { object_types: true } },
        },
      });
      
      return reply.status(201).send({ data: link });
    },
  );

  // Delete link
  fastify.delete<{
    Params: { ontologyRid: string; linkTypeApiName: string; linkId: string };
  }>(
    '/ontologies/:ontologyRid/linkTypes/:linkTypeApiName/links/:linkId',
    {
      schema: {
        tags: ['Links'],
        description: 'Delete a link',
      },
    },
    async (req, reply) => {
      const link = await prisma.links.findFirst({
        where: { id: req.params.linkId },
      });
      if (!link) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Link '${req.params.linkId}' not found` },
        });
      }
      await prisma.links.delete({ where: { id: link.id } });
      return reply.status(204).send();
    },
  );

  // Get linked instances for an object
  fastify.get<{
    Params: { ontologyRid: string; objectRid: string };
    Querystring: { linkTypeApiName?: string; direction?: string };
  }>(
    '/ontologies/:ontologyRid/objects/:objectRid/links',
    {
      schema: {
        tags: ['Links'],
        description: 'Get all links for an object',
      },
    },
    async (req, reply) => {
      const object = await prisma.objects.findFirst({
        where: { rid: req.params.objectRid },
      });
      if (!object) {
        return reply.code(404).send({
          error: { code: 'NOT_FOUND', message: `Object '${req.params.objectRid}' not found` },
        });
      }
      
      const outgoing = req.query.direction !== 'incoming';
      const incoming = req.query.direction !== 'outgoing';
      
      const where: any = {};
      if (outgoing) where.sourceObjectId = object.id;
      if (incoming) where.targetObjectId = object.id;
      if (req.query.linkTypeApiName) {
        const lt = await prisma.link_types.findUnique({ where: { apiName: req.query.linkTypeApiName } });
        if (lt) where.linkTypeId = lt.id;
      }
      
      const links = await prisma.links.findMany({
        where,
        include: {
          link_types: true,
          objects_links_sourceObjectIdToobjects: { include: { object_types: true } },
          objects_links_targetObjectIdToobjects: { include: { object_types: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      return reply.send({ data: links });
    },
  );

  // ═══════════════════════════════════════════════════════════════════════
  // Search Objects Route (新增)
  // ═══════════════════════════════════════════════════════════════════════

  // Search objects across all types
  fastify.get<{
    Params: { ontologyRid: string };
    Querystring: { search?: string; objectTypeApiName?: string; limit?: string; offset?: string };
  }>(
    '/ontologies/:ontologyRid/objects',
    {
      schema: {
        tags: ['Objects'],
        description: 'Search objects across all object types',
      },
    },
    async (req, reply) => {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      
      const where: any = {};
      
      if (req.query.objectTypeApiName) {
        const objectType = await prisma.object_types.findUnique({
          where: { apiName: req.query.objectTypeApiName },
        });
        if (objectType) {
          where.objectTypeId = objectType.id;
        }
      }
      
      const [objects, total] = await Promise.all([
        prisma.objects.findMany({
          where,
          include: { object_types: true },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.objects.count({ where }),
      ]);
      
      return reply.send({ data: objects, total });
    },
  );
};