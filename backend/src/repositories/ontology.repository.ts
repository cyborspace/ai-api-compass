/**
 * Ontology Repository
 * 
 * 基于 Palantir Ontology 标准的数据访问层
 * 
 * 核心原则:
 * - 所有业务实体都是 Object 表中的实例
 * - 通过 ObjectType 区分类型
 * - 通过 LinkType 和 Link 管理关系
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// Types
// ============================================================================

/**
 * Object 查询参数
 */
export interface ObjectQueryParams {
  objectTypeApiName: string;
  where?: Record<string, any>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: any;
}

/**
 * Link 查询参数
 */
export interface LinkQueryParams {
  linkTypeApiName: string;
  sourceObjectId?: string;
  targetObjectId?: string;
}

/**
 * 对比查询参数
 */
export interface CompareParams {
  toolSlugs: string[];
  dimension?: 'all' | 'pricing' | 'capability' | 'performance' | 'reputation';
}

// ============================================================================
// Ontology Repository
// ============================================================================

export class OntologyRepository {
  
  // =============================================================================
  // ObjectType Operations
  // =============================================================================
  
  /**
   * 获取 ObjectType 定义
   */
  async getObjectType(apiName: string) {
    return await prisma.object_types.findUnique({
      where: { apiName }
    });
  }
  
  /**
   * 获取所有 ObjectType
   */
  async getAllObjectTypes(status?: string) {
    return await prisma.object_types.findMany({
      where: status ? { status } : undefined,
      orderBy: { displayName: 'asc' }
    });
  }
  
  /**
   * 创建 ObjectType
   */
  async createObjectType(data: {
    rid: string;
    apiName: string;
    displayName: string;
    description?: string;
    primaryKeys?: string[];
    titleKeys?: string[];
    properties?: any[];
  }) {
    return await prisma.object_types.create({
      data: {
        id: crypto.randomUUID(),
        rid: data.rid,
        apiName: data.apiName,
        displayName: data.displayName,
        description: data.description,
        primaryKeys: data.primaryKeys || [],
        titleKeys: data.titleKeys || [],
        properties: data.properties || [],
        updatedAt: new Date(),
      }
    });
  }

  // =============================================================================
  // Object Operations
  // =============================================================================
  
  /**
   * 创建 Object 实例
   */
  async createObject(params: {
    objectTypeApiName: string;
    rid: string;
    properties: Record<string, any>;
    status?: string;
  }) {
    const objectType = await this.getObjectType(params.objectTypeApiName);
    if (!objectType) {
      throw new Error(`ObjectType ${params.objectTypeApiName} not found`);
    }
    
    return await prisma.objects.create({
      data: {
        id: crypto.randomUUID(),
        objectTypeId: objectType.id,
        rid: params.rid,
        properties: params.properties as any,
        status: params.status || 'active',
        updatedAt: new Date(),
      },
      include: { object_types: true }
    });
  }
  
  /**
   * 根据 rid 获取 Object
   */
  async getObjectByRid(rid: string) {
    return await prisma.objects.findFirst({
      where: { rid },
      include: { object_types: true }
    });
  }
  
  /**
   * 根据 ObjectType 和条件查询 Objects
   */
  async queryObjects(params: ObjectQueryParams) {
    const objectType = await this.getObjectType(params.objectTypeApiName);
    if (!objectType) {
      throw new Error(`ObjectType ${params.objectTypeApiName} not found`);
    }
    
    // 构建 Prisma where 条件
    const where: any = { objectTypeId: objectType.id };
    
    // 如果有 properties 条件，需要使用 JSON 查询
    if (params.where) {
      for (const [key, value] of Object.entries(params.where)) {
        where.properties = {
          ...where.properties,
          [key]: value
        };
      }
    }
    
    return await prisma.objects.findMany({
      where,
      orderBy: params.orderBy || { createdAt: 'desc' },
      take: params.limit || 20,
      skip: params.offset || 0,
      include: params.include || { object_types: true }
    });
  }
  
  /**
   * 搜索 Objects (基于 properties JSON)
   */
  async searchObjects(params: {
    objectTypeApiName: string;
    searchFields: string[];
    query: string;
    filters?: Record<string, any>;
    limit?: number;
    offset?: number;
  }) {
    const objectType = await this.getObjectType(params.objectTypeApiName);
    if (!objectType) {
      throw new Error(`ObjectType ${params.objectTypeApiName} not found`);
    }
    
    // 构建搜索条件
    const searchConditions = params.searchFields.map(field => ({
      properties: { [field]: { contains: params.query, mode: 'insensitive' as const } }
    }));
    
    // 合并所有条件
    const where: any = {
      objectTypeId: objectType.id,
      OR: searchConditions.length > 0 ? searchConditions : undefined,
      ...params.filters
    };
    
    return await prisma.objects.findMany({
      where,
      take: params.limit || 20,
      skip: params.offset || 0,
      orderBy: { createdAt: 'desc' },
      include: { object_types: true }
    });
  }
  
  /**
   * 更新 Object
   */
  async updateObject(rid: string, properties: Record<string, any>) {
    const obj = await this.getObjectByRid(rid);
    if (!obj) throw new Error(`Object ${rid} not found`);
    return await prisma.objects.update({
      where: { id: obj.id },
      data: { properties: properties as any, updatedAt: new Date() }
    });
  }

  /**
   * 删除 Object
   */
  async deleteObject(rid: string) {
    const obj = await this.getObjectByRid(rid);
    if (!obj) throw new Error(`Object ${rid} not found`);

    // 先删除关联的 Links
    await prisma.links.deleteMany({
      where: {
        OR: [
          { sourceObjectId: obj.id },
          { targetObjectId: obj.id }
        ]
      }
    });

    // 删除 Object
    return await prisma.objects.delete({
      where: { id: obj.id }
    });
  }

  // =============================================================================
  // LinkType Operations
  // =============================================================================
  
  /**
   * 获取 LinkType
   */
  async getLinkType(apiName: string) {
    return await prisma.link_types.findUnique({
      where: { apiName }
    });
  }
  
  /**
   * 获取所有 LinkType
   */
  async getAllLinkTypes(status?: string) {
    return await prisma.link_types.findMany({
      where: status ? { status } : undefined,
      include: {
        }
    });
  }

  // =============================================================================
  // Link Operations
  // =============================================================================
  
  /**
   * 创建 Link
   */
  async createLink(params: {
    linkTypeApiName: string;
    sourceObjectRid: string;
    targetObjectRid: string;
    properties?: Record<string, any>;
  }) {
    const linkType = await this.getLinkType(params.linkTypeApiName);
    if (!linkType) {
      throw new Error(`LinkType ${params.linkTypeApiName} not found`);
    }
    
    // 验证 source 和 target objects 存在
    const sourceObject = await this.getObjectByRid(params.sourceObjectRid);
    const targetObject = await this.getObjectByRid(params.targetObjectRid);
    
    if (!sourceObject || !targetObject) {
      throw new Error('Source or target object not found');
    }
    
    return await prisma.links.create({
      data: {
        id: crypto.randomUUID(),
        linkTypeId: linkType.id,
        sourceObjectId: sourceObject.id,
        targetObjectId: targetObject.id,
        properties: (params.properties || {}) as any,
        updatedAt: new Date(),
      },
      include: {
        link_types: true,
        objects_links_sourceObjectIdToobjects: { include: { object_types: true } },
        objects_links_targetObjectIdToobjects: { include: { object_types: true } }
      }
    });
  }
  
  /**
   * 查询 Links
   */
  async queryLinks(params: LinkQueryParams) {
    const linkType = await this.getLinkType(params.linkTypeApiName);
    if (!linkType) {
      throw new Error(`LinkType ${params.linkTypeApiName} not found`);
    }
    
    const where: any = { linkTypeId: linkType.id };
    
    if (params.sourceObjectId) {
      where.sourceObjectId = params.sourceObjectId;
    }
    if (params.targetObjectId) {
      where.targetObjectId = params.targetObjectId;
    }
    
    return await prisma.links.findMany({
      where,
      include: {
        objects_links_sourceObjectIdToobjects: { include: { object_types: true } },
        objects_links_targetObjectIdToobjects: { include: { object_types: true } }
      }
    });
  }
  
  /**
   * 获取 Object 的所有出站 Links
   */
  async getOutgoingLinks(objectId: string) {
    return await prisma.links.findMany({
      where: { sourceObjectId: objectId },
      include: {
        link_types: true,
        objects_links_targetObjectIdToobjects: { include: { object_types: true } }
      }
    });
  }
  
  /**
   * 获取 Object 的所有入站 Links
   */
  async getIncomingLinks(objectId: string) {
    return await prisma.links.findMany({
      where: { targetObjectId: objectId },
      include: {
        link_types: true,
        objects_links_sourceObjectIdToobjects: { include: { object_types: true } }
      }
    });
  }
  
  /**
   * 删除 Link
   */
  async deleteLink(linkTypeApiName: string, sourceObjectId: string, targetObjectId: string) {
    const linkType = await this.getLinkType(linkTypeApiName);
    if (!linkType) {
      throw new Error(`LinkType ${linkTypeApiName} not found`);
    }
    
    return await prisma.links.delete({
      where: {
        linkTypeId_sourceObjectId_targetObjectId: {
          linkTypeId: linkType.id,
          sourceObjectId,
          targetObjectId
        }
      }
    });
  }

  // =============================================================================
  // Action Operations
  // =============================================================================
  
  /**
   * 创建 Action
   */
  async createAction(params: {
    actionTypeApiName: string;
    objectId?: string;
    parameters: Record<string, any>;
    submittedBy?: string;
  }) {
    const actionType = await prisma.action_types.findUnique({
      where: { apiName: params.actionTypeApiName }
    });
    
    if (!actionType) {
      throw new Error(`ActionType ${params.actionTypeApiName} not found`);
    }
    
    return await prisma.actions.create({
      data: {
        id: crypto.randomUUID(),
        actionTypeId: actionType.id,
        objectId: params.objectId,
        parameters: params.parameters as any,
        submittedBy: params.submittedBy,
        submittedAt: new Date(),
        status: 'pending',
        updatedAt: new Date(),
      },
      include: { action_types: true }
    });
  }
  
  /**
   * 更新 Action 状态
   */
  async updateAction(id: string, data: {
    status?: string;
    result?: any;
    error?: string;
    startedAt?: Date;
    completedAt?: Date;
  }) {
    return await prisma.actions.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  // =============================================================================
  // Statistics Operations
  // =============================================================================
  
  /**
   * 增加 Object 的属性值 (用于计数)
   */
  async incrementProperty(rid: string, property: string, increment: number = 1) {
    const object = await this.getObjectByRid(rid);
    if (!object) {
      throw new Error(`Object ${rid} not found`);
    }
    
    const props = object.properties as Record<string, any>;
    const currentValue = (props[property] as number) || 0;

    return await this.updateObject(rid, {
      ...props,
      [property]: currentValue + increment
    });
  }

  // =============================================================================
  // Utility Operations
  // =============================================================================
  
  /**
   * 获取 Object 的完整图谱 (包括所有关联)
   */
  async getObjectGraph(rid: string) {
    const object = await this.getObjectByRid(rid);
    if (!object) {
      return null;
    }
    
    const outgoingLinks = await this.getOutgoingLinks(object.id);
    const incomingLinks = await this.getIncomingLinks(object.id);
    
    return {
      object,
      outgoingLinks,
      incomingLinks
    };
  }
  
  /**
   * 检查 Link 是否存在
   */
  async linkExists(linkTypeApiName: string, sourceObjectId: string, targetObjectId: string) {
    const linkType = await this.getLinkType(linkTypeApiName);
    if (!linkType) return false;
    
    const count = await prisma.links.count({
      where: {
        linkTypeId: linkType.id,
        sourceObjectId,
        targetObjectId
      }
    });
    
    return count > 0;
  }
  
  /**
   * 批量创建 Links
   */
  async createLinksBatch(links: Array<{
    linkTypeApiName: string;
    sourceObjectRid: string;
    targetObjectRid: string;
    properties?: Record<string, any>;
  }>) {
    const results = [];
    
    for (const link of links) {
      try {
        // 检查是否已存在
        const sourceObject = await this.getObjectByRid(link.sourceObjectRid);
        const targetObject = await this.getObjectByRid(link.targetObjectRid);
        
        if (sourceObject && targetObject) {
          const exists = await this.linkExists(
            link.linkTypeApiName,
            sourceObject.id,
            targetObject.id
          );
          
          if (!exists) {
            const result = await this.createLink({
              linkTypeApiName: link.linkTypeApiName,
              sourceObjectRid: link.sourceObjectRid,
              targetObjectRid: link.targetObjectRid,
              properties: link.properties,
            });
            results.push({ success: true, data: result });
          }
        }
      } catch (error) {
        results.push({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const ontologyRepository = new OntologyRepository();
