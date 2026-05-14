/**
 * REST API Connector
 * 
 * 连接 REST API 数据源
 * 支持 GET/POST/PUT/PATCH/DELETE
 */

import { BaseConnector } from './base-connector.js';
import type {
  DataSourceConfig,
  DataQuery,
  DataRecord,
  WriteResult,
  ConnectionTestResult,
  SourceSchema,
  ChangeEvent,
} from '../types';

export class RestApiConnector extends BaseConnector {
  private baseUrl: string;
  private headers: Record<string, string>;
  private authHeaders: Record<string, string> = {};

  constructor(config: DataSourceConfig) {
    super(config);
    this.baseUrl = config.connection.baseUrl || '';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.connection.headers,
    };
  }

  async connect(): Promise<void> {
    try {
      // Setup auth
      await this.setupAuth();
      
      // Test connection
      const testResult = await this.testConnection();
      if (testResult.success) {
        this.setStatus('connected');
      } else {
        this.setStatus('error', testResult.message);
      }
    } catch (error) {
      this.setStatus('error', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.authHeaders = {};
    this.setStatus('disconnected');
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // Try to fetch a health endpoint or the base URL
      const healthUrl = `${this.baseUrl}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { ...this.headers, ...this.authHeaders },
        signal: AbortSignal.timeout(10000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          success: true,
          latency,
          message: 'Connection successful',
          details: { statusCode: response.status },
        };
      }

      // Try base URL as fallback
      const baseResponse = await fetch(this.baseUrl, {
        method: 'GET',
        headers: { ...this.headers, ...this.authHeaders },
        signal: AbortSignal.timeout(10000),
      });

      if (baseResponse.ok || baseResponse.status === 404) {
        return {
          success: true,
          latency: Date.now() - startTime,
          message: 'Connection successful (base URL accessible)',
          details: { statusCode: baseResponse.status },
        };
      }

      return {
        success: false,
        latency: Date.now() - startTime,
        message: `HTTP ${baseResponse.status}: ${baseResponse.statusText}`,
        details: { statusCode: baseResponse.status },
      };
    } catch (error) {
      return {
        success: false,
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : String(error),
        details: { error: String(error) },
      };
    }
  }

  async read(query: DataQuery): Promise<DataRecord[]> {
    return this.executeWithRetry(async () => {
      const url = this.buildUrl(query);
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...this.headers, ...this.authHeaders },
        signal: AbortSignal.timeout(this.config.connection.timeout || 30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different response structures
      const records = this.extractRecords(data);
      
      // Map records to target format
      return records.map((record) => this.mapRecord(record));
    }, 'read');
  }

  async *readStream(query: DataQuery): AsyncIterable<DataRecord> {
    const records = await this.read(query);
    for (const record of records) {
      yield record;
    }
  }

  async write(records: DataRecord[]): Promise<WriteResult> {
    return this.executeWithRetry(async () => {
      const results: DataRecord[] = [];
      const errors: any[] = [];

      for (const record of records) {
        try {
          const sourceRecord = this.mapRecordToSource(record);
          const url = `${this.baseUrl}/${this.config.mapping.sourceEntity}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { ...this.headers, ...this.authHeaders },
            body: JSON.stringify(sourceRecord),
            signal: AbortSignal.timeout(this.config.connection.timeout || 30000),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const created = await response.json();
          results.push(this.mapRecord(created));
        } catch (error) {
          errors.push(this.createSyncError(
            record.id,
            'WRITE_ERROR',
            error instanceof Error ? error.message : String(error)
          ));
        }
      }

      return {
        success: errors.length === 0,
        created: results.length,
        updated: 0,
        deleted: 0,
        errors,
      };
    }, 'write');
  }

  async update(records: DataRecord[]): Promise<WriteResult> {
    return this.executeWithRetry(async () => {
      const results: DataRecord[] = [];
      const errors: any[] = [];

      for (const record of records) {
        try {
          const sourceRecord = this.mapRecordToSource(record);
          const pkField = this.config.mapping.primaryKey.source;
          const url = `${this.baseUrl}/${this.config.mapping.sourceEntity}/${sourceRecord[pkField]}`;
          
          const response = await fetch(url, {
            method: 'PUT',
            headers: { ...this.headers, ...this.authHeaders },
            body: JSON.stringify(sourceRecord),
            signal: AbortSignal.timeout(this.config.connection.timeout || 30000),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const updated = await response.json();
          results.push(this.mapRecord(updated));
        } catch (error) {
          errors.push(this.createSyncError(
            record.id,
            'UPDATE_ERROR',
            error instanceof Error ? error.message : String(error)
          ));
        }
      }

      return {
        success: errors.length === 0,
        created: 0,
        updated: results.length,
        deleted: 0,
        errors,
      };
    }, 'update');
  }

  async delete(ids: string[]): Promise<WriteResult> {
    return this.executeWithRetry(async () => {
      const errors: any[] = [];
      let deleted = 0;

      for (const id of ids) {
        try {
          const url = `${this.baseUrl}/${this.config.mapping.sourceEntity}/${id}`;
          
          const response = await fetch(url, {
            method: 'DELETE',
            headers: { ...this.headers, ...this.authHeaders },
            signal: AbortSignal.timeout(this.config.connection.timeout || 30000),
          });

          if (!response.ok && response.status !== 404) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          deleted++;
        } catch (error) {
          errors.push(this.createSyncError(
            id,
            'DELETE_ERROR',
            error instanceof Error ? error.message : String(error)
          ));
        }
      }

      return {
        success: errors.length === 0,
        created: 0,
        updated: 0,
        deleted,
        errors,
      };
    }, 'delete');
  }

  async discoverSchema(): Promise<SourceSchema> {
    return this.executeWithRetry(async () => {
      // Try to get schema from OpenAPI or similar endpoint
      const schemaUrl = `${this.baseUrl}/schema`;
      
      try {
        const response = await fetch(schemaUrl, {
          method: 'GET',
          headers: { ...this.headers, ...this.authHeaders },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const schema = await response.json();
          return this.parseSchema(schema);
        }
      } catch {
        // Fallback: infer schema from sample data
      }

      // Fallback: fetch sample data and infer schema
      const sampleUrl = `${this.baseUrl}/${this.config.mapping.sourceEntity}?limit=1`;
      const response = await fetch(sampleUrl, {
        method: 'GET',
        headers: { ...this.headers, ...this.authHeaders },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Failed to discover schema: HTTP ${response.status}`);
      }

      const data = await response.json();
      const records = this.extractRecords(data);
      
      if (records.length === 0) {
        throw new Error('No data available for schema discovery');
      }

      return this.inferSchemaFromRecords(records[0]);
    }, 'discoverSchema');
  }

  async subscribe(callback: (event: ChangeEvent) => void): Promise<void> {
    // REST API doesn't natively support subscriptions
    // Could implement polling or webhook-based subscriptions
    console.warn(`[${this.id}] Subscribe not supported for REST API, consider using polling or webhooks`);
    throw new Error('Subscribe not implemented for REST API connector');
  }

  // ==================== Private Methods ====================

  private async setupAuth(): Promise<void> {
    const auth = this.config.connection.auth;
    if (!auth) return;

    switch (auth.type) {
      case 'bearer':
        this.authHeaders['Authorization'] = `Bearer ${auth.token}`;
        break;
      case 'basic':
        const credentials = btoa(`${auth.username}:${auth.password}`);
        this.authHeaders['Authorization'] = `Basic ${credentials}`;
        break;
      case 'api_key':
        const headerName = auth.apiKeyHeader || 'X-API-Key';
        this.authHeaders[headerName] = auth.apiKey || '';
        break;
      case 'oauth2':
        await this.refreshOAuthToken(auth);
        break;
      case 'custom':
        this.authHeaders = { ...this.authHeaders, ...auth.customHeaders };
        break;
    }
  }

  private async refreshOAuthToken(auth: any): Promise<void> {
    if (!auth.tokenEndpoint) return;

    const response = await fetch(auth.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: auth.clientId || '',
        client_secret: auth.clientSecret || '',
        scope: auth.scope || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`OAuth token refresh failed: HTTP ${response.status}`);
    }

    const tokenData = await response.json();
    this.authHeaders['Authorization'] = `Bearer ${tokenData.access_token}`;
  }

  private buildUrl(query: DataQuery): string {
    const url = new URL(`${this.baseUrl}/${query.entity}`);
    
    if (query.limit) {
      url.searchParams.set('limit', String(query.limit));
    }
    if (query.offset) {
      url.searchParams.set('offset', String(query.offset));
    }
    if (query.cursor) {
      url.searchParams.set('cursor', query.cursor);
    }
    if (query.filter) {
      url.searchParams.set('filter', JSON.stringify(query.filter));
    }
    if (query.orderBy) {
      url.searchParams.set('sort', JSON.stringify(query.orderBy));
    }

    return url.toString();
  }

  private extractRecords(data: any): DataRecord[] {
    if (Array.isArray(data)) {
      return data;
    }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }
    if (data.records && Array.isArray(data.records)) {
      return data.records;
    }
    // If it's a single object, wrap in array
    if (typeof data === 'object' && data !== null) {
      return [data];
    }
    return [];
  }

  private parseSchema(schema: any): SourceSchema {
    // Parse OpenAPI or JSON Schema
    if (schema.openapi || schema.swagger) {
      return this.parseOpenApiSchema(schema);
    }
    if (schema.$schema) {
      return this.parseJsonSchema(schema);
    }
    throw new Error('Unsupported schema format');
  }

  private parseOpenApiSchema(schema: any): SourceSchema {
    const entities: any[] = [];
    const paths = schema.paths || {};

    for (const [path, methods] of Object.entries(paths)) {
      const getMethod = (methods as any).get;
      if (getMethod && getMethod.responses?.['200']?.content?.['application/json']?.schema) {
        const responseSchema = getMethod.responses['200'].content['application/json'].schema;
        entities.push({
          name: path.split('/').pop() || path,
          fields: this.extractFieldsFromSchema(responseSchema),
          primaryKey: 'id',
        });
      }
    }

    return { entities };
  }

  private parseJsonSchema(schema: any): SourceSchema {
    const properties = schema.properties || {};
    const required = schema.required || [];

    return {
      entities: [{
        name: this.config.mapping.sourceEntity,
        fields: Object.entries(properties).map(([name, prop]: [string, any]) => ({
          name,
          type: prop.type || 'string',
          required: required.includes(name),
          nullable: !required.includes(name),
          defaultValue: prop.default,
        })),
        primaryKey: 'id',
      }],
    };
  }

  private extractFieldsFromSchema(schema: any): any[] {
    if (schema.type === 'array' && schema.items) {
      return this.extractFieldsFromSchema(schema.items);
    }

    const properties = schema.properties || {};
    const required = schema.required || [];

    return Object.entries(properties).map(([name, prop]: [string, any]) => ({
      name,
      type: prop.type || 'string',
      required: required.includes(name),
      nullable: !required.includes(name),
      defaultValue: prop.default,
    }));
  }

  private inferSchemaFromRecords(record: DataRecord): SourceSchema {
    return {
      entities: [{
        name: this.config.mapping.sourceEntity,
        fields: Object.entries(record).map(([name, value]) => ({
          name,
          type: this.inferType(value),
          required: false,
          nullable: value === null,
          defaultValue: undefined,
        })),
        primaryKey: this.config.mapping.primaryKey.source,
      }],
    };
  }

  private inferType(value: any): string {
    if (value === null || value === undefined) return 'string';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (value instanceof Date) return 'timestamp';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'string';
  }
}
