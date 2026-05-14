import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function registerOntologyRoutes(fastify: FastifyInstance) {

  fastify.get('/ontologies', async () => {
    const objectTypes = await prisma.object_types.findMany();
    const linkTypes = await prisma.link_types.findMany();
    return {
      data: [{ rid: 'ri.ontology.main', apiName: 'ai-compass', displayName: 'AI Compass Ontology', objectTypesCount: objectTypes.length, linkTypesCount: linkTypes.length }]
    };
  });

  fastify.get('/ontologies/:ontologyRid', async (request) => {
    const { ontologyRid } = request.params as { ontologyRid: string };
    
    const [objectTypes, linkTypes, valueTypes, actions, functions, interfaces] = await Promise.all([
      prisma.object_types.count(),
      prisma.link_types.count(),
      prisma.value_types.count(),
      prisma.action_types.count(),
      prisma.functions.count(),
      prisma.interfaces.count(),
    ]);

    return {
      data: {
        rid: ontologyRid,
        apiName: ontologyRid,
        displayName: 'AI Compass Ontology',
        status: 'active',
        objectTypesCount: objectTypes,
        linkTypesCount: linkTypes,
        valueTypesCount: valueTypes,
        actionTypesCount: actions,
        functionsCount: functions,
        interfacesCount: interfaces,
      }
    };
  });

  fastify.get('/ontologies/:ontologyRid/objectTypes', async () => {
    const objectTypes = await prisma.object_types.findMany();
    return { data: objectTypes };
  });

  fastify.get('/ontologies/:ontologyRid/objectTypes/:apiName', async (request) => {
    const { apiName } = request.params as { apiName: string };
    const objectType = await prisma.object_types.findUnique({ where: { apiName } });
    if (!objectType) return { error: 'Not found' };
    
    const objectsCount = await prisma.objects.count({ where: { objectTypeId: objectType.id } });
    return { data: { ...objectType, objectsCount } };
  });

  fastify.get('/ontologies/:ontologyRid/objectTypes/:apiName/objects', async (request) => {
    const { apiName } = request.params as { apiName: string };
    const { limit = '20', offset = '0' } = request.query as { limit?: string; offset?: string };
    
    const objectType = await prisma.object_types.findUnique({ where: { apiName } });
    if (!objectType) return { error: 'Not found' };
    
    const [objects, total] = await Promise.all([
      prisma.objects.findMany({ where: { objectTypeId: objectType.id }, take: parseInt(limit), skip: parseInt(offset) }),
      prisma.objects.count({ where: { objectTypeId: objectType.id } }),
    ]);
    
    return { data: objects, total, limit: parseInt(limit), offset: parseInt(offset) };
  });

  fastify.get('/ontologies/:ontologyRid/linkTypes', async () => {
    const linkTypes = await prisma.link_types.findMany();
    return { data: linkTypes };
  });

  fastify.get('/ontologies/:ontologyRid/valueTypes', async () => {
    const valueTypes = await prisma.value_types.findMany();
    return { data: valueTypes };
  });

  fastify.get('/ontologies/:ontologyRid/functions', async () => {
    const functions = await prisma.functions.findMany();
    return { data: functions };
  });

  fastify.get('/ontologies/:ontologyRid/interfaces', async () => {
    const interfaces = await prisma.interfaces.findMany({
      where: {
        status: {
          not: 'deprecated'
        }
      }
    });
    return { data: interfaces };
  });

  fastify.get('/ontologies/:ontologyRid/actionTypes', async (request) => {
    const actionTypes = await prisma.action_types.findMany({
      where: {
        status: {
          not: 'deprecated'
        }
      }
    });
    return { data: actionTypes };
  });

  fastify.get<{
    Params: { ontologyRid: string };
  }>('/ontologies/:ontologyRid/groups', async (request) => {
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

    return { data: groups };
  });
}
