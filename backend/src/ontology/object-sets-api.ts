/**
 * Object Sets API
 * 
 * 实现 Palantir Foundry 风格的 Object Sets 查询 API
 * 支持过滤、搜索、聚合等操作
 */

import { PrismaClient, Prisma } from '@prisma/client';

export interface ObjectSetQuery {
  objectType: string;
  filter?: ObjectSetFilter;
  search?: string;
  orderBy?: ObjectSetOrderBy;
  limit?: number;
  offset?: number;
  select?: string[];
  include?: ObjectSetInclude;
}

export interface ObjectSetFilter {
  and?: ObjectSetFilter[];
  or?: ObjectSetFilter[];
  not?: ObjectSetFilter;
  conditions?: ObjectSetCondition[];
}

export interface ObjectSetCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

export type FilterOperator = 
  | 'eq'           // 等于
  | 'ne'           // 不等于
  | 'gt'           // 大于
  | 'gte'          // 大于等于
  | 'lt'           // 小于
  | 'lte'          // 小于等于
  | 'in'           // 在列表中
  | 'notIn'        // 不在列表中
  | 'contains'     // 包含（字符串）
  | 'startsWith'   // 开头匹配
  | 'endsWith'     // 结尾匹配
  | 'isNull'       // 为空
  | 'isNotNull'    // 不为空
  | 'between'      // 范围
  | 'exactMatch';   // 精确匹配

export interface ObjectSetOrderBy {
  field: string;
  direction?: 'asc' | 'desc';
}

export interface ObjectSetInclude {
  [key: string]: boolean | ObjectSetInclude;
}

export interface ObjectSetResult<T = any> {
  data: T[];
  metadata: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    objectType: string;
    executionTime: number;
  };
}

export interface AggregationQuery {
  objectType: string;
  field: string;
  operation: AggregationOperation;
  groupBy?: string[];
  filter?: ObjectSetFilter;
}

export type AggregationOperation = 
  | 'count'      // 计数
  | 'sum'        // 求和
  | 'avg'        // 平均值
  | 'min'        // 最小值
  | 'max'        // 最大值
  | 'median'     // 中位数
  | 'stddev';    // 标准差

export interface AggregationResult {
  value: number;
  grouped?: Array<{
    key: any;
    value: number;
  }>;
}

export class ObjectSetsAPI {
  constructor(private prisma: PrismaClient) {}

  /**
   * Query an Object Set
   */
  async query<T = any>(objectSetQuery: ObjectSetQuery): Promise<ObjectSetResult<T>> {
    const startTime = Date.now();
    const { objectType, filter, search, orderBy, limit = 20, offset = 0, select, include } = objectSetQuery;

    const queryOptions: {
      where?: any;
      orderBy?: any;
      take: number;
      skip: number;
      select?: any;
      include?: any;
    } = {
      take: limit,
      skip: offset,
    };

    // Build where clause from filters
    if (filter || search) {
      queryOptions.where = this.buildWhereClause(objectType, filter, search);
    }

    // Build orderBy
    if (orderBy) {
      queryOptions.orderBy = this.buildOrderBy(objectType, orderBy);
    }

    // Build select
    if (select && select.length > 0) {
      queryOptions.select = this.buildSelect(objectType, select);
    }

    // Build include for relations
    if (include) {
      queryOptions.include = this.buildInclude(include);
    }

    // Execute query based on object type
    const data = await this.executeQuery<T>(objectType, queryOptions);
    
    // Count total
    const countWhere = queryOptions.where ? { where: queryOptions.where } : undefined;
    const total = await this.countObjects(objectType, countWhere);

    return {
      data,
      metadata: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
        objectType,
        executionTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Search Objects
   */
  async search(
    objectType: string,
    query: string,
    options?: {
      fields?: string[];
      limit?: number;
      offset?: number;
      filter?: ObjectSetFilter;
    }
  ): Promise<ObjectSetResult> {
    return this.query({
      objectType,
      search: query,
      filter: options?.filter,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Filter Objects
   */
  async filter(
    objectType: string,
    filter: ObjectSetFilter,
    options?: {
      orderBy?: ObjectSetOrderBy;
      limit?: number;
      offset?: number;
    }
  ): Promise<ObjectSetResult> {
    return this.query({
      objectType,
      filter,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Aggregate Objects
   */
  async aggregate(query: AggregationQuery): Promise<AggregationResult> {
    const { objectType, field, operation, groupBy, filter } = query;

    const where = filter ? this.buildWhereClause(objectType, filter) : undefined;

    if (groupBy && groupBy.length > 0) {
      // Grouped aggregation
      const results = await this.prisma.functions.groupBy({
        by: groupBy as any,
        _count: { [field]: true },
        where,
      });

      return {
        value: results.length,
        grouped: results.map((r: any) => ({
          key: groupBy.map((f) => r[f]),
          value: r._count[field],
        })),
      };
    } else {
      // Simple aggregation
      const result = await this.executeAggregation(objectType, field, operation, where);
      return { value: result };
    }
  }

  /**
   * Union of Object Sets
   */
  async union(
    queries: ObjectSetQuery[],
    options?: { limit?: number; offset?: number }
  ): Promise<ObjectSetResult> {
    const results = await Promise.all(queries.map((q) => this.query(q)));
    
    // Merge and deduplicate
    const mergedData = new Map<string, any>();
    for (const result of results) {
      for (const item of result.data) {
        const key = item.id || item.slug || JSON.stringify(item);
        if (!mergedData.has(key)) {
          mergedData.set(key, item);
        }
      }
    }

    const data = Array.from(mergedData.values());
    const total = data.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      data: data.slice(offset, offset + limit),
      metadata: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        objectType: 'UNION',
        executionTime: 0,
      },
    };
  }

  /**
   * Intersect of Object Sets
   */
  async intersect(
    queries: ObjectSetQuery[],
    options?: { limit?: number; offset?: number }
  ): Promise<ObjectSetResult> {
    const results = await Promise.all(queries.map((q) => this.query(q)));
    
    if (results.length === 0) {
      return { data: [], metadata: { total: 0, limit: 20, offset: 0, hasMore: false, objectType: 'INTERSECT', executionTime: 0 } };
    }

    // Find intersection by key
    const dataSets = results.map((r) => 
      new Set(r.data.map((item: any) => item.id || item.slug || JSON.stringify(item)))
    );

    const intersection = dataSets.reduce((acc, set) => {
      const result = new Set<string>();
      for (const item of acc) {
        if (set.has(item)) {
          result.add(item);
        }
      }
      return result;
    });

    const mergedData = results[0].data.filter((item: any) => {
      const key = item.id || item.slug || JSON.stringify(item);
      return intersection.has(key);
    });

    const total = mergedData.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      data: mergedData.slice(offset, offset + limit),
      metadata: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        objectType: 'INTERSECT',
        executionTime: 0,
      },
    };
  }

  /**
   * Subtract Object Sets
   */
  async subtract(
    baseQuery: ObjectSetQuery,
    subtractQueries: ObjectSetQuery[],
    options?: { limit?: number; offset?: number }
  ): Promise<ObjectSetResult> {
    const baseResult = await this.query(baseQuery);
    const subtractResults = await Promise.all(subtractQueries.map((q) => this.query(q)));

    // Get keys to subtract
    const subtractKeys = new Set<string>();
    for (const result of subtractResults) {
      for (const item of result.data) {
        subtractKeys.add(item.id || item.slug || JSON.stringify(item));
      }
    }

    // Filter out
    const data = baseResult.data.filter((item: any) => {
      const key = item.id || item.slug || JSON.stringify(item);
      return !subtractKeys.has(key);
    });

    const total = data.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;

    return {
      data: data.slice(offset, offset + limit),
      metadata: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        objectType: 'SUBTRACT',
        executionTime: 0,
      },
    };
  }

  // ==================== Private Helpers ====================

  private buildWhereClause(
    objectType: string,
    filter?: ObjectSetFilter,
    search?: string
  ): any {
    const conditions: any[] = [];

    // Handle search
    if (search) {
      const searchCondition = this.buildSearchCondition(objectType, search);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Handle explicit conditions
    if (filter?.conditions) {
      for (const condition of filter.conditions) {
        conditions.push(this.buildCondition(condition));
      }
    }

    // Handle AND
    if (filter?.and && filter.and.length > 0) {
      const andConditions = filter.and.map((f) => this.buildWhereClause(objectType, f));
      if (andConditions.length > 0) {
        conditions.push({ AND: andConditions });
      }
    }

    // Handle OR
    if (filter?.or && filter.or.length > 0) {
      const orConditions = filter.or.map((f) => this.buildWhereClause(objectType, f));
      if (orConditions.length > 0) {
        conditions.push({ OR: orConditions });
      }
    }

    // Handle NOT
    if (filter?.not) {
      conditions.push({ NOT: this.buildWhereClause(objectType, filter.not) });
    }

    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }

  private buildSearchCondition(objectType: string, search: string): any {
    const searchableFields = this.getSearchableFields(objectType);
    
    if (searchableFields.length === 0) {
      return undefined;
    }

    const searchConditions = searchableFields.map((field) => {
      // Handle nested fields like "technicalSpec.contextWindow"
      if (field.includes('.')) {
        return this.buildNestedSearchCondition(field, search);
      }
      return {
        [field]: {
          contains: search,
          mode: 'insensitive',
        },
      };
    });

    return { OR: searchConditions };
  }

  private buildNestedSearchCondition(field: string, search: string): any {
    const parts = field.split('.');
    const result: any = {};
    let current = result;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = {
      contains: search,
      mode: 'insensitive',
    };

    return result;
  }

  private buildCondition(condition: ObjectSetCondition): any {
    const { field, operator, value } = condition;

    switch (operator) {
      case 'eq':
        return { [field]: value };
      case 'ne':
        return { [field]: { not: value } };
      case 'gt':
        return { [field]: { gt: value } };
      case 'gte':
        return { [field]: { gte: value } };
      case 'lt':
        return { [field]: { lt: value } };
      case 'lte':
        return { [field]: { lte: value } };
      case 'in':
        return { [field]: { in: value } };
      case 'notIn':
        return { [field]: { notIn: value } };
      case 'contains':
        return { [field]: { contains: value, mode: 'insensitive' } };
      case 'startsWith':
        return { [field]: { startsWith: value } };
      case 'endsWith':
        return { [field]: { endsWith: value } };
      case 'isNull':
        return { [field]: null };
      case 'isNotNull':
        return { [field]: { not: null } };
      case 'between':
        return { [field]: { gte: value[0], lte: value[1] } };
      case 'exactMatch':
        return { [field]: { equals: value, mode: 'insensitive' } };
      default:
        return { [field]: value };
    }
  }

  private buildOrderBy(objectType: string, orderBy: ObjectSetOrderBy): any {
    const { field, direction = 'asc' } = orderBy;
    
    // Handle nested fields
    if (field.includes('.')) {
      const parts = field.split('.');
      return {
        [parts[0]]: {
          [parts[1]]: direction,
        },
      };
    }

    return { [field]: direction };
  }

  private buildSelect(objectType: string, select: string[]): any {
    const result: any = {};
    for (const field of select) {
      result[field] = true;
    }
    return result;
  }

  private buildInclude(include: ObjectSetInclude): any {
    const result: any = {};
    for (const [key, value] of Object.entries(include)) {
      if (typeof value === 'boolean') {
        result[key] = value;
      } else {
        result[key] = { include: this.buildInclude(value) };
      }
    }
    return result;
  }

  private getSearchableFields(objectType: string): string[] {
    switch (objectType) {
      case 'AIGCTool':
        return ['name', 'slug', 'description', 'tagline', 'technicalSpec.description'];
      case 'ToolCategory':
        return ['name', 'slug', 'description'];
      case 'ToolProvider':
        return ['name', 'slug', 'description'];
      case 'ToolTag':
        return ['name', 'slug'];
      case 'UseCase':
        return ['name', 'slug', 'description'];
      default:
        return ['name', 'description'];
    }
  }

  private async executeQuery<T>(objectType: string, options: any): Promise<T[]> {
    switch (objectType) {
      case 'AIGCTool':
        return this.prisma.functions.findMany(options) as any;
      default:
        throw new Error(`Unknown object type: ${objectType}`);
    }
  }

  private async countObjects(objectType: string, options?: any): Promise<number> {
    switch (objectType) {
      case 'AIGCTool':
        return this.prisma.functions.count(options);
      default:
        throw new Error(`Unknown object type: ${objectType}`);
    }
  }

  private async executeAggregation(
    objectType: string,
    field: string,
    operation: AggregationOperation,
    where?: any
  ): Promise<number> {
    const options = { where, ...this.buildAggregationSelect(field, operation) };

    if (objectType === 'AIGCTool') {
      const result = await this.prisma.functions.aggregate(options);
      return this.extractAggregationValue(result, operation, field);
    }

    return 0;
  }

  private buildAggregationSelect(field: string, operation: AggregationOperation): any {
    switch (operation) {
      case 'count':
        return { _count: { [field]: true } };
      case 'sum':
        return { _sum: { [field]: true } };
      case 'avg':
        return { _avg: { [field]: true } };
      case 'min':
        return { _min: { [field]: true } };
      case 'max':
        return { _max: { [field]: true } };
      default:
        return { _count: true };
    }
  }

  private extractAggregationValue(result: any, operation: AggregationOperation, field: string): number {
    switch (operation) {
      case 'count':
        return result._count?.[field] || 0;
      case 'sum':
        return result._sum?.[field] || 0;
      case 'avg':
        return result._avg?.[field] || 0;
      case 'min':
        return result._min?.[field] || 0;
      case 'max':
        return result._max?.[field] || 0;
      default:
        return result._count || 0;
    }
  }
}
