import { PrismaClient } from '@prisma/client';

export class OntologyRepository {
  constructor(private prisma: PrismaClient) {}

  // ═══════════════════════════════════════════════════════════════════════
  // ObjectType CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async listObjectTypes(filters?: { status?: string }) {
    return this.prisma.object_types.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getObjectTypeByApiName(apiName: string) {
    return this.prisma.object_types.findUnique({
      where: { apiName },
    });
  }

  async createObjectType(data: {
    apiName: string;
    displayName: string;
    description?: string;
    status?: string;
    icon?: string;
    color?: string;
    primaryKeys?: string[];
    titleKeys?: string[];
    properties?: any;
    backingDatasources?: any;
    typeClasses?: any;
  }) {
    return this.prisma.object_types.create({
      data: {
        id: crypto.randomUUID(),
        rid: `ot_${crypto.randomUUID()}`,
        apiName: data.apiName,
        displayName: data.displayName,
        description: data.description,
        status: data.status ?? 'active',
        icon: data.icon,
        color: data.color,
        primaryKeys: data.primaryKeys ?? [],
        titleKeys: data.titleKeys ?? [],
        properties: data.properties ?? [],
        backingDatasources: data.backingDatasources ?? [],
        typeClasses: data.typeClasses ?? [],
        updatedAt: new Date(),
      },
    });
  }

  async updateObjectType(apiName: string, data: {
    displayName?: string;
    description?: string;
    status?: string;
    icon?: string;
    color?: string;
    primaryKeys?: string[];
    titleKeys?: string[];
    properties?: any;
    backingDatasources?: any;
    typeClasses?: any;
  }) {
    return this.prisma.object_types.update({
      where: { apiName },
      data,
    });
  }

  async deleteObjectType(apiName: string) {
    return this.prisma.object_types.delete({
      where: { apiName },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Object CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async listObjects(
    objectTypeApiName: string,
    options?: {
      limit?: number;
      offset?: number;
      where?: Record<string, any>;
      search?: string;
      orderBy?: Record<string, 'asc' | 'desc'>;
    },
  ) {
    const objectType = await this.prisma.object_types.findUnique({
      where: { apiName: objectTypeApiName },
    });
    if (!objectType) return null;

    // Build structured property filters for object_properties
    const propWhere: Record<string, any> = { objectTypeId: objectType.id };
    const objectWhere: Record<string, any> = { objectTypeId: objectType.id, status: 'active' };
    let usePropTable = false;

    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (key === 'status') {
          objectWhere.status = value;
        } else if (this.isStructuredProperty(key)) {
          // Use indexed property column
          propWhere[`prop_${key}`] = value;
          usePropTable = true;
        } else {
          // Fallback to JSON path filtering for non-structured properties
          objectWhere.properties = { ...objectWhere.properties, path: [key], equals: value };
        }
      }
    }

    // If using structured properties, query via object_properties for better performance
    if (usePropTable) {
      const [propData, propTotal] = await Promise.all([
        this.prisma.object_properties.findMany({
          where: propWhere,
          orderBy: this.buildOrderBy(options?.orderBy) || { prop_createdAt: 'desc' },
          take: options?.limit,
          skip: options?.offset,
          include: { objects: { include: { object_types: { select: { apiName: true, displayName: true } } } } },
        }),
        this.prisma.object_properties.count({ where: propWhere }),
      ]);

      const data = propData.map(p => p.objects).filter(Boolean);
      return { data, total: propTotal };
    }

    // Text search fallback
    if (options?.search) {
      return this.searchObjects({
        search: options.search,
        objectTypeApiName,
        limit: options?.limit,
        offset: options?.offset,
      });
    }

    const [data, total] = await Promise.all([
      this.prisma.objects.findMany({
        where: objectWhere,
        orderBy: options?.orderBy || { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
        include: {
          object_types: { select: { apiName: true, displayName: true } },
        },
      }),
      this.prisma.objects.count({ where: objectWhere }),
    ]);

    return { data, total };
  }

  /**
   * Check if a property name has a structured column in object_properties
   */
  private isStructuredProperty(key: string): boolean {
    const structuredProps = [
      'slug', 'name', 'status', 'pricingType', 'developer', 'currency',
      'isPopular', 'isFeatured', 'isVerified', 'isOpenSource', 'isChineseNative',
      'viewCount', 'favoriteCount', 'compareCount', 'averageRating', 'reviewCount',
      'startingPrice', 'releaseDate', 'createdAt', 'updatedAt',
    ];
    return structuredProps.includes(key);
  }

  /**
   * Build Prisma orderBy from property names
   */
  private buildOrderBy(orderBy?: Record<string, 'asc' | 'desc'>): Record<string, 'asc' | 'desc'> | undefined {
    if (!orderBy) return undefined;
    const result: Record<string, 'asc' | 'desc'> = {};
    for (const [key, direction] of Object.entries(orderBy)) {
      if (this.isStructuredProperty(key)) {
        result[`prop_${key}`] = direction;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  async getObject(objectTypeApiName: string, objectRid: string) {
    const objectType = await this.prisma.object_types.findUnique({
      where: { apiName: objectTypeApiName },
    });
    if (!objectType) return null;

    return this.prisma.objects.findUnique({
      where: {
        objectTypeId_rid: {
          objectTypeId: objectType.id,
          rid: objectRid,
        },
      },
      include: {
        object_types: true,
        links_links_sourceObjectIdToobjects: {
          include: {
            link_types: { select: { apiName: true, displayName: true } },
            objects_links_targetObjectIdToobjects: {
              include: { object_types: { select: { apiName: true, displayName: true } } },
            },
          },
        },
        links_links_targetObjectIdToobjects: {
          include: {
            link_types: { select: { apiName: true, displayName: true } },
            objects_links_sourceObjectIdToobjects: {
              include: { object_types: { select: { apiName: true, displayName: true } } },
            },
          },
        },
      },
    });
  }

  async searchObjects(options?: {
    search?: string;
    objectTypeApiName?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Record<string, any> = { status: 'active' };

    if (options?.objectTypeApiName) {
      const objectType = await this.prisma.object_types.findUnique({
        where: { apiName: options.objectTypeApiName },
      });
      if (objectType) {
        where.objectTypeId = objectType.id;
      }
    }

    // For text search, we use a simple approach with Prisma
    // In production, you'd use PostgreSQL full-text search or Meilisearch
    if (options?.search) {
      // Use raw query for JSON text search
      const searchPattern = `%${options.search}%`;
      const results = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM objects WHERE status = 'active' AND properties::text ILIKE $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3`,
        searchPattern,
        options?.limit ?? 50,
        options?.offset ?? 0,
      );

      const ids = results.map(r => r.id);
      if (ids.length === 0) return { data: [], total: 0 };

      const data = await this.prisma.objects.findMany({
        where: { id: { in: ids } },
        include: {
          object_types: { select: { apiName: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*)::int as count FROM objects WHERE status = 'active' AND properties::text ILIKE $1`,
        searchPattern,
      );

      return { data, total: totalResult[0]?.count ?? 0 };
    }

    const [data, total] = await Promise.all([
      this.prisma.objects.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
        include: {
          object_types: { select: { apiName: true, displayName: true } },
        },
      }),
      this.prisma.objects.count({ where }),
    ]);

    return { data, total };
  }

  async createObject(
    objectTypeApiName: string,
    properties: Record<string, any>,
    rid?: string,
  ) {
    const objectType = await this.prisma.object_types.findUnique({
      where: { apiName: objectTypeApiName },
    });
    if (!objectType) return null;

    return this.prisma.objects.create({
      data: {
        id: crypto.randomUUID(),
        objectTypeId: objectType.id,
        rid: rid ?? `obj_${crypto.randomUUID()}`,
        properties: properties as any ?? {},
        status: 'active',
        updatedAt: new Date(),
      },
      include: {
        object_types: { select: { apiName: true, displayName: true } },
      },
    });
  }

  async updateObject(
    objectTypeApiName: string,
    objectRid: string,
    properties: Record<string, any>,
  ) {
    const objectType = await this.prisma.object_types.findUnique({
      where: { apiName: objectTypeApiName },
    });
    if (!objectType) return null;

    return this.prisma.objects.update({
      where: {
        objectTypeId_rid: {
          objectTypeId: objectType.id,
          rid: objectRid,
        },
      },
      data: {
        properties,
        version: { increment: 1 },
      },
      include: {
        object_types: { select: { apiName: true, displayName: true } },
      },
    });
  }

  async deleteObject(objectTypeApiName: string, objectRid: string) {
    const objectType = await this.prisma.object_types.findUnique({
      where: { apiName: objectTypeApiName },
    });
    if (!objectType) return null;

    return this.prisma.objects.delete({
      where: {
        objectTypeId_rid: {
          objectTypeId: objectType.id,
          rid: objectRid,
        },
      },
    });
  }

  async batchGetObjects(rids: string[]) {
    return this.prisma.objects.findMany({
      where: { rid: { in: rids } },
      include: {
        object_types: { select: { apiName: true, displayName: true } },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LinkType CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async listLinkTypes(filters?: { status?: string }) {
    return this.prisma.link_types.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      include: {
        // },
        // },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getLinkTypeByApiName(apiName: string) {
    return this.prisma.link_types.findUnique({
      where: { apiName },
    });
  }

  async createLinkType(data: {
    apiName: string;
    displayName: string;
    description?: string;
    sourceObjectTypeId: string;
    targetObjectTypeId: string;
    cardinality?: string;
    visibility?: string;
    propertyDefinitions?: any;
    backingDatasources?: any;
    typeClasses?: any;
  }) {
    return this.prisma.link_types.create({
      data: {
        id: crypto.randomUUID(),
        rid: `lt_${crypto.randomUUID()}`,
        apiName: data.apiName,
        displayName: data.displayName,
        description: data.description,
        sourceObjectTypeId: data.sourceObjectTypeId,
        targetObjectTypeId: data.targetObjectTypeId,
        cardinality: data.cardinality ?? 'MANY_TO_MANY',
        visibility: data.visibility ?? 'prominent',
        propertyDefinitions: data.propertyDefinitions ?? [],
        backingDatasources: data.backingDatasources ?? [],
        typeClasses: data.typeClasses ?? [],
        updatedAt: new Date(),
      },
    });
  }

  async updateLinkType(apiName: string, data: {
    displayName?: string;
    description?: string;
    cardinality?: string;
    visibility?: string;
    propertyDefinitions?: any;
    backingDatasources?: any;
    typeClasses?: any;
  }) {
    return this.prisma.link_types.update({
      where: { apiName },
      data,
    });
  }

  async deleteLinkType(apiName: string) {
    return this.prisma.link_types.delete({
      where: { apiName },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Link CRUD
  // ═══════════════════════════════════════════════════════════════════════

  async listLinks(
    linkTypeApiName: string,
    options?: { limit?: number; offset?: number },
  ) {
    const linkType = await this.prisma.link_types.findUnique({
      where: { apiName: linkTypeApiName },
    });
    if (!linkType) return null;

    const [data, total] = await Promise.all([
      this.prisma.links.findMany({
        where: { linkTypeId: linkType.id },
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_sourceObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
          objects_links_targetObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      }),
      this.prisma.links.count({
        where: { linkTypeId: linkType.id },
      }),
    ]);

    return { data, total };
  }

  async createLink(
    linkTypeApiName: string,
    sourceObjectRid: string,
    targetObjectRid: string,
    properties?: Record<string, any>,
  ) {
    const linkType = await this.prisma.link_types.findUnique({
      where: { apiName: linkTypeApiName },
    });
    if (!linkType) return null;

    const sourceObject = await this.prisma.objects.findFirst({
      where: { rid: sourceObjectRid },
    });
    const targetObject = await this.prisma.objects.findFirst({
      where: { rid: targetObjectRid },
    });
    if (!sourceObject || !targetObject) return null;

    return this.prisma.links.create({
      data: {
        id: crypto.randomUUID(),
        linkTypeId: linkType.id,
        sourceObjectId: sourceObject.id,
        targetObjectId: targetObject.id,
        properties: properties as any ?? {},
        updatedAt: new Date(),
      },
      include: {
        link_types: { select: { apiName: true, displayName: true } },
        objects_links_sourceObjectIdToobjects: {
          include: { object_types: { select: { apiName: true, displayName: true } } },
        },
        objects_links_targetObjectIdToobjects: {
          include: { object_types: { select: { apiName: true, displayName: true } } },
        },
      },
    });
  }

  async deleteLink(linkTypeApiName: string, linkId: string) {
    const linkType = await this.prisma.link_types.findUnique({
      where: { apiName: linkTypeApiName },
    });
    if (!linkType) return null;

    return this.prisma.links.delete({
      where: { id: linkId, linkTypeId: linkType.id },
    });
  }

  async getLinkedInstances(
    objectRid: string,
    options?: { linkTypeApiName?: string; direction?: 'outgoing' | 'incoming' | 'both' },
  ) {
    const object = await this.prisma.objects.findFirst({
      where: { rid: objectRid },
    });
    if (!object) return null;

    const links: any[] = [];

    if (!options?.direction || options.direction === 'outgoing' || options.direction === 'both') {
      const outgoingWhere: Record<string, any> = { sourceObjectId: object.id };
      if (options?.linkTypeApiName) {
        const linkType = await this.prisma.link_types.findUnique({
          where: { apiName: options.linkTypeApiName },
        });
        if (linkType) outgoingWhere.linkTypeId = linkType.id;
      }
      const outgoing = await this.prisma.links.findMany({
        where: outgoingWhere,
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_targetObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      });
      links.push(...outgoing.map(l => ({ ...l, direction: 'outgoing' })));
    }

    if (!options?.direction || options.direction === 'incoming' || options.direction === 'both') {
      const incomingWhere: Record<string, any> = { targetObjectId: object.id };
      if (options?.linkTypeApiName) {
        const linkType = await this.prisma.link_types.findUnique({
          where: { apiName: options.linkTypeApiName },
        });
        if (linkType) incomingWhere.linkTypeId = linkType.id;
      }
      const incoming = await this.prisma.links.findMany({
        where: incomingWhere,
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_sourceObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      });
      links.push(...incoming.map(l => ({ ...l, direction: 'incoming' })));
    }

    return links;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ActionType
  // ═══════════════════════════════════════════════════════════════════════

  async listActionTypes(filters?: { status?: string }) {
    return this.prisma.action_types.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getActionTypeByApiName(apiName: string) {
    return this.prisma.action_types.findUnique({
      where: { apiName },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Function
  // ═══════════════════════════════════════════════════════════════════════

  async listFunctions(filters?: { status?: string; functionType?: string }) {
    const where: Record<string, any> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.functionType) where.functionType = filters.functionType;

    return this.prisma.functions.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getFunctionByApiName(apiName: string) {
    return this.prisma.functions.findUnique({
      where: { apiName },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Interface
  // ═══════════════════════════════════════════════════════════════════════

  async listInterfaces(filters?: { status?: string }) {
    return this.prisma.interfaces.findMany({
      where: filters?.status ? { status: filters.status } : undefined,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getInterfaceByApiName(apiName: string) {
    return this.prisma.interfaces.findUnique({
      where: { apiName },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Graph Traversal
  // ═══════════════════════════════════════════════════════════════════════

  async getNeighbors(objectRid: string, depth: number) {
    const object = await this.prisma.objects.findFirst({
      where: { rid: objectRid },
      include: { object_types: { select: { apiName: true, displayName: true } } },
    });
    if (!object) return null;

    const visited = new Set<string>();
    const result: Array<{
      object: any;
      depth: number;
      link_types: { apiName: string; displayName: string };
      direction: 'outgoing' | 'incoming';
    }> = [];

    // BFS
    const queue: Array<{ objectId: string; currentDepth: number }> = [
      { objectId: object.id, currentDepth: 0 },
    ];
    visited.add(object.id);

    while (queue.length > 0) {
      const { objectId, currentDepth } = queue.shift()!;

      if (currentDepth >= depth) continue;

      // Get outgoing links
      const outgoingLinks = await this.prisma.links.findMany({
        where: { sourceObjectId: objectId },
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_targetObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      });

      for (const link of outgoingLinks) {
        if (!visited.has(link.targetObjectId)) {
          visited.add(link.targetObjectId);
          result.push({
            object: link.objects_links_targetObjectIdToobjects,
            depth: currentDepth + 1,
            link_types: link.link_types,
            direction: 'outgoing',
          });
          queue.push({ objectId: link.targetObjectId, currentDepth: currentDepth + 1 });
        }
      }

      // Get incoming links
      const incomingLinks = await this.prisma.links.findMany({
        where: { targetObjectId: objectId },
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_sourceObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      });

      for (const link of incomingLinks) {
        if (!visited.has(link.sourceObjectId)) {
          visited.add(link.sourceObjectId);
          result.push({
            object: link.objects_links_sourceObjectIdToobjects,
            depth: currentDepth + 1,
            link_types: link.link_types,
            direction: 'incoming',
          });
          queue.push({ objectId: link.sourceObjectId, currentDepth: currentDepth + 1 });
        }
      }
    }

    return {
      source: object,
      neighbors: result,
      totalNeighbors: result.length,
    };
  }

  async findShortestPath(fromRid: string, toRid: string, maxDepth: number) {
    const fromObject = await this.prisma.objects.findFirst({
      where: { rid: fromRid },
      include: { object_types: { select: { apiName: true, displayName: true } } },
    });
    const toObject = await this.prisma.objects.findFirst({
      where: { rid: toRid },
      include: { object_types: { select: { apiName: true, displayName: true } } },
    });

    if (!fromObject || !toObject) return null;
    if (fromObject.id === toObject.id) {
      return { path: [fromObject], links: [], length: 0 };
    }

    // BFS with path tracking
    const visited = new Set<string>();
    const queue: Array<{
      objectId: string;
      path: any[];
      links: any[];
    }> = [
      {
        objectId: fromObject.id,
        path: [fromObject],
        links: [],
      },
    ];
    visited.add(fromObject.id);

    while (queue.length > 0) {
      const { objectId, path, links } = queue.shift()!;

      if (links.length >= maxDepth) continue;

      // Get all links (both directions)
      const allLinks = await this.prisma.links.findMany({
        where: {
          OR: [
            { sourceObjectId: objectId },
            { targetObjectId: objectId },
          ],
        },
        include: {
          link_types: { select: { apiName: true, displayName: true } },
          objects_links_sourceObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
          objects_links_targetObjectIdToobjects: {
            include: { object_types: { select: { apiName: true, displayName: true } } },
          },
        },
      });

      for (const link of allLinks) {
        const isOutgoing = link.sourceObjectId === objectId;
        const nextObjectId = isOutgoing ? link.targetObjectId : link.sourceObjectId;
        const nextObject = isOutgoing ? link.objects_links_targetObjectIdToobjects : link.objects_links_sourceObjectIdToobjects;

        if (visited.has(nextObjectId)) continue;

        const newPath = [...path, nextObject];
        const newLinks = [...links, { ...links, direction: isOutgoing ? 'outgoing' : 'incoming' }];

        if (nextObjectId === toObject.id) {
          return {
            path: newPath,
            links: newLinks,
            length: newLinks.length,
          };
        }

        visited.add(nextObjectId);
        queue.push({ objectId: nextObjectId, path: newPath, links: newLinks });
      }
    }

    return { path: [], links: [], length: -1, message: 'No path found within max depth' };
  }
}
