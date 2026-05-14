import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function aigcRoutes(fastify: FastifyInstance) {

  fastify.get('/ontology', async () => {
    const objectTypes = await prisma.object_types.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
    });
    const linkTypes = await prisma.link_types.findMany({
      where: { status: 'active' },
      include: { object_types_link_types_sourceObjectTypeIdToobject_types: true, object_types_link_types_targetObjectTypeIdToobject_types: true }
    });

    return {
      success: true,
      data: {
        objectTypes,
        linkTypes,
        stats: {
          totalObjectTypes: objectTypes.length,
          totalLinkTypes: linkTypes.length
        }
      }
    };
  });

  fastify.get('/object-types', async () => {
    const objectTypes = await prisma.object_types.findMany({
      where: { status: 'active' },
      orderBy: { displayName: 'asc' },
    });
    return { success: true, data: objectTypes };
  });

  fastify.get('/tools', async (request: FastifyRequest<{ Querystring: {
    limit?: string;
    offset?: string;
    search?: string;
    categories?: string;
    pricingTypes?: string;
    capabilities?: string;
    availableInChina?: string;
    sortBy?: string;
  } }>) => {
    const limit = parseInt(request.query.limit || '20', 10);
    const offset = parseInt(request.query.offset || '0', 10);

    const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
    if (!aigcToolType) {
      return { success: false, error: 'AIGCTool ObjectType not found' };
    }

    const params: any[] = [];
    const conditions: string[] = [`o."objectTypeId" = $${params.length + 1}`];
    params.push(aigcToolType.id);

    // Search filter
    if (request.query.search) {
      params.push(`%${request.query.search}%`);
      conditions.push(`(o.properties->>'name' ILIKE $${params.length} OR o.properties->>'description' ILIKE $${params.length})`);
    }

    // Pricing types filter
    if (request.query.pricingTypes) {
      const pricingTypes = request.query.pricingTypes.split(',');
      params.push(pricingTypes);
      conditions.push(`o.properties->>'pricingType' = ANY($${params.length}::text[])`);
    }

    // Capabilities filter
    if (request.query.capabilities) {
      const capabilities = request.query.capabilities.split(',');
      // Check if any of the requested capabilities exist in the capabilities array
      params.push(capabilities);
      conditions.push(`o.properties->'capabilities' ?| $${params.length}::text[]`);
    }

    // availableInChina filter
    if (request.query.availableInChina === 'true') {
      conditions.push(`(o.properties->>'availableInChina')::boolean = true`);
    } else if (request.query.availableInChina === 'false') {
      conditions.push(`(o.properties->>'availableInChina')::boolean = false`);
    }

    // Category filter via link
    let categoryFilter = '';
    if (request.query.categories) {
      const categorySlugs = request.query.categories.split(',');
      // First get category object ids
      const toolCatType = await prisma.object_types.findUnique({ where: { apiName: 'ToolCategory' } });
      if (toolCatType) {
        const catObjects = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, properties FROM objects o WHERE o."objectTypeId" = $1 AND o.properties->>'slug' = ANY($2::text[])`,
          toolCatType.id, categorySlugs
        );
        const catIds = catObjects.map(c => c.id);
        if (catIds.length > 0) {
          const linkType = await prisma.link_types.findFirst({ where: { apiName: 'toolBelongsToCategory' } });
          if (linkType) {
            const linkedObjects = await prisma.$queryRawUnsafe<{ sourceObjectId: string }[]>(
              `SELECT "sourceObjectId" FROM links l WHERE l."linkTypeId" = $1 AND l."targetObjectId" = ANY($2::text[])`,
              linkType.id, catIds
            );
            const toolIds = linkedObjects.map(l => l.sourceObjectId);
            if (toolIds.length > 0) {
              params.push(toolIds);
              categoryFilter = `AND o.id = ANY($${params.length}::text[])`;
            }
          }
        }
      }
    }

    // Sorting
    let orderClause = 'o."createdAt" DESC';
    if (request.query.sortBy === 'rating') {
      orderClause = `(o.properties->>'averageRating')::numeric DESC NULLS LAST`;
    } else if (request.query.sortBy === 'price_asc') {
      orderClause = `(o.properties->>'inputPrice')::numeric ASC NULLS LAST`;
    } else if (request.query.sortBy === 'price_desc') {
      orderClause = `(o.properties->>'inputPrice')::numeric DESC NULLS LAST`;
    } else if (request.query.sortBy === 'heat') {
      orderClause = `(o.properties->>'heatScore')::numeric DESC NULLS LAST`;
    }

    const whereClause = conditions.join(' AND ');

    // Count query
    const countQuery = `SELECT COUNT(*) FROM objects o WHERE ${whereClause} ${categoryFilter}`;
    const countResult = await prisma.$queryRawUnsafe<[{ count: string }]>(countQuery, ...params);
    const total = parseInt(countResult[0].count, 10);

    // Data query
    const dataQuery = `SELECT o.properties, o.id FROM objects o WHERE ${whereClause} ${categoryFilter} ORDER BY ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const tools = await prisma.$queryRawUnsafe<any[]>(dataQuery, ...params, limit, offset);

    return {
      success: true,
      data: tools.map(t => t.properties),
      total,
      limit,
      offset
    };
  });

  fastify.get('/tools/:slug', async (request: FastifyRequest<{ Params: { slug: string } }>) => {
    const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
    if (!aigcToolType) {
      return { success: false, error: 'AIGCTool ObjectType not found' };
    }

    const tool = await prisma.objects.findFirst({
      where: {
        objectTypeId: aigcToolType.id,
        properties: { path: ['slug'], equals: request.params.slug }
      }
    });

    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }

    return { success: true, data: tool.properties };
  });

  fastify.get('/categories', async () => {
    const toolCatType = await prisma.object_types.findUnique({ where: { apiName: 'ToolCategory' } });
    if (!toolCatType) {
      return { success: false, error: 'ToolCategory ObjectType not found' };
    }

    const categories = await prisma.objects.findMany({
      where: { objectTypeId: toolCatType.id },
      orderBy: { createdAt: 'asc' }
    });

    return {
      success: true,
      data: categories.map(c => c.properties)
    };
  });

  fastify.get('/suggestions', async (request: FastifyRequest<{ Querystring: { query: string } }>) => {
    if (!request.query.query || request.query.query.length < 2) {
      return { success: true, data: [] };
    }

    const aigcToolType = await prisma.object_types.findUnique({ where: { apiName: 'AIGCTool' } });
    if (!aigcToolType) {
      return { success: true, data: [] };
    }

    const tools = await prisma.objects.findMany({
      where: {
        objectTypeId: aigcToolType.id,
        properties: {
          path: ['name'],
          string_contains: request.query.query,
        } as any,
      },
      take: 10
    });

    return {
      success: true,
      data: tools.map(t => {
        const tProps = t.properties as Record<string, any> || {};
        return {
          slug: tProps.slug,
          name: tProps.name,
          tagline: tProps.tagline,
          pricingType: tProps.pricingType
        };
      })
    };
  });
}

export default aigcRoutes;
