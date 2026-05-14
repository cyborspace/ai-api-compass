/**
 * Database Connector
 *
 * 连接数据库数据源
 * 支持 PostgreSQL, MySQL, SQLite 等
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

export class DatabaseConnector extends BaseConnector {
  private connection: any = null;
  private dbType: string = 'postgresql';

  constructor(config: DataSourceConfig) {
    super(config);
    this.dbType = config.connection.database || 'postgresql';
  }

  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid bundling all drivers
      switch (this.dbType) {
        case 'postgresql':
        case 'postgres':
          const { Pool } = await import('pg');
          this.connection = new Pool({
            host: this.config.connection.host,
            port: this.config.connection.port || 5432,
            database: this.config.connection.database,
            user: this.config.connection.username,
            password: this.config.connection.password,
            ssl: this.config.connection.ssl,
            connectionTimeoutMillis: this.config.connection.timeout || 30000,
          });
          break;
        case 'mysql':
          // mysql2 is an optional dependency - install it if needed: npm install mysql2
          {
            const mysql = await import('mysql2/promise' as any).catch(() => { throw new Error('mysql2 not installed. Run: npm install mysql2'); });
            this.connection = await mysql.createConnection({
              host: this.config.connection.host,
              port: this.config.connection.port || 3306,
              database: this.config.connection.database,
              user: this.config.connection.username,
              password: this.config.connection.password,
              ssl: this.config.connection.ssl,
            });
          }
          break;
        case 'sqlite':
          // sqlite3 and sqlite are optional dependencies
          {
            const sqlite3 = await import('sqlite3' as any).catch(() => { throw new Error('sqlite3 not installed. Run: npm install sqlite3 sqlite'); });
            const { open } = await import('sqlite' as any).catch(() => { throw new Error('sqlite not installed. Run: npm install sqlite'); });
            this.connection = await open({
              filename: this.config.connection.filePath || ':memory:',
              driver: sqlite3.Database,
            });
          }
          break;
        default:
          throw new Error(`Unsupported database type: ${this.dbType}`);
      }

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
    if (this.connection) {
      if (this.dbType === 'postgresql' || this.dbType === 'postgres') {
        await this.connection.end();
      } else if (this.dbType === 'mysql') {
        await this.connection.end();
      } else if (this.dbType === 'sqlite') {
        await this.connection.close();
      }
      this.connection = null;
    }
    this.setStatus('disconnected');
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();

    try {
      if (!this.connection) {
        throw new Error('Not connected');
      }

      let result;
      switch (this.dbType) {
        case 'postgresql':
        case 'postgres':
          result = await this.connection.query('SELECT NOW() as now');
          break;
        case 'mysql':
          result = await this.connection.execute('SELECT NOW() as now');
          break;
        case 'sqlite':
          result = await this.connection.get('SELECT datetime("now") as now');
          break;
        default:
          throw new Error(`Unsupported database type: ${this.dbType}`);
      }

      const latency = Date.now() - startTime;
      return {
        success: true,
        latency,
        message: 'Database connection successful',
        details: { result },
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
      const { sql, params } = this.buildSelectQuery(query);

      let rows;
      switch (this.dbType) {
        case 'postgresql':
        case 'postgres':
          const pgResult = await this.connection.query(sql, params);
          rows = pgResult.rows;
          break;
        case 'mysql':
          const [mysqlRows] = await this.connection.execute(sql, params);
          rows = mysqlRows;
          break;
        case 'sqlite':
          rows = await this.connection.all(sql, params);
          break;
        default:
          throw new Error(`Unsupported database type: ${this.dbType}`);
      }

      return rows.map((row: any) => this.mapRecord(row));
    }, 'read');
  }

  async *readStream(query: DataQuery): AsyncIterable<DataRecord> {
    // For databases, we use cursor-based streaming for large datasets
    const batchSize = this.config.sync.batchSize || 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const batchQuery = { ...query, limit: batchSize, offset };
      const records = await this.read(batchQuery);

      for (const record of records) {
        yield record;
      }

      hasMore = records.length === batchSize;
      offset += batchSize;

      if (hasMore) {
        await this.sleep(10); // Small delay to prevent overwhelming the database
      }
    }
  }

  async write(records: DataRecord[]): Promise<WriteResult> {
    return this.executeWithRetry(async () => {
      const results: DataRecord[] = [];
      const errors: any[] = [];

      for (const record of records) {
        try {
          const sourceRecord = this.mapRecordToSource(record);
          const columns = Object.keys(sourceRecord).filter(k => k !== 'id');
          const values = columns.map(col => sourceRecord[col]);

          const { sql, params } = this.buildInsertQuery(
            this.config.mapping.sourceEntity,
            columns,
            values
          );

          let insertResult;
          switch (this.dbType) {
            case 'postgresql':
            case 'postgres':
              const pgResult = await this.connection.query(sql, params);
              insertResult = pgResult.rows[0];
              break;
            case 'mysql':
              const [mysqlResult] = await this.connection.execute(sql, params);
              insertResult = { id: (mysqlResult as any).insertId };
              break;
            case 'sqlite':
              const sqliteResult = await this.connection.run(sql, params);
              insertResult = { id: sqliteResult.lastID };
              break;
          }

          results.push(this.mapRecord({ ...sourceRecord, ...insertResult }));
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
          const pkValue = sourceRecord[pkField];

          const columns = Object.keys(sourceRecord).filter(k => k !== pkField && k !== 'id');
          const values = columns.map(col => sourceRecord[col]);

          const { sql, params } = this.buildUpdateQuery(
            this.config.mapping.sourceEntity,
            pkField,
            pkValue,
            columns,
            values
          );

          switch (this.dbType) {
            case 'postgresql':
            case 'postgres':
              await this.connection.query(sql, params);
              break;
            case 'mysql':
              await this.connection.execute(sql, params);
              break;
            case 'sqlite':
              await this.connection.run(sql, params);
              break;
          }

          results.push(record);
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

      const pkField = this.config.mapping.primaryKey.source;
      const placeholders = ids.map((_, i) => this.getPlaceholder(i)).join(',');
      const sql = `DELETE FROM ${this.escapeIdentifier(this.config.mapping.sourceEntity)} WHERE ${this.escapeIdentifier(pkField)} IN (${placeholders})`;

      try {
        switch (this.dbType) {
          case 'postgresql':
          case 'postgres':
            await this.connection.query(sql, ids);
            break;
          case 'mysql':
            await this.connection.execute(sql, ids);
            break;
          case 'sqlite':
            await this.connection.run(sql, ids);
            break;
        }
        deleted = ids.length;
      } catch (error) {
        errors.push(this.createSyncError(
          ids.join(','),
          'DELETE_ERROR',
          error instanceof Error ? error.message : String(error)
        ));
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
      const tableName = this.config.mapping.sourceEntity;
      let columns: any[] = [];

      switch (this.dbType) {
        case 'postgresql':
        case 'postgres':
          const pgResult = await this.connection.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [tableName]);
          columns = pgResult.rows.map((row: any) => ({
            name: row.column_name,
            type: row.data_type,
            required: row.is_nullable === 'NO',
            nullable: row.is_nullable === 'YES',
            defaultValue: row.column_default,
          }));
          break;
        case 'mysql':
          const [mysqlRows] = await this.connection.execute(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = ?
            ORDER BY ordinal_position
          `, [tableName]);
          columns = (mysqlRows as any[]).map((row: any) => ({
            name: row.column_name,
            type: row.data_type,
            required: row.is_nullable === 'NO',
            nullable: row.is_nullable === 'YES',
            defaultValue: row.column_default,
          }));
          break;
        case 'sqlite':
          const sqliteRows = await this.connection.all(`PRAGMA table_info(${tableName})`);
          columns = sqliteRows.map((row: any) => ({
            name: row.name,
            type: row.type,
            required: row.notnull === 1,
            nullable: row.notnull === 0,
            defaultValue: row.dflt_value,
          }));
          break;
      }

      return {
        entities: [{
          name: tableName,
          fields: columns,
          primaryKey: this.config.mapping.primaryKey.source,
        }],
      };
    }, 'discoverSchema');
  }

  // ==================== Private Methods ====================

  private buildSelectQuery(query: DataQuery): { sql: string; params: any[] } {
    const tableName = this.escapeIdentifier(query.entity);
    const fields = query.fields?.map(f => this.escapeIdentifier(f)).join(', ') || '*';
    const params: any[] = [];

    let sql = `SELECT ${fields} FROM ${tableName}`;

    // WHERE clause
    if (query.filter && query.filter.length > 0) {
      const conditions = query.filter.map((f, i) => {
        params.push(f.value);
        return `${this.escapeIdentifier(f.field)} ${this.getOperator(f.operator)} ${this.getPlaceholder(i)}`;
      });
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // ORDER BY
    if (query.orderBy && query.orderBy.length > 0) {
      const orderClauses = query.orderBy.map(o =>
        `${this.escapeIdentifier(o.field)} ${o.direction.toUpperCase()}`
      );
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // LIMIT and OFFSET
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }
    if (query.offset) {
      sql += ` OFFSET ${query.offset}`;
    }

    return { sql, params };
  }

  private buildInsertQuery(table: string, columns: string[], values: any[]): { sql: string; params: any[] } {
    const placeholders = values.map((_, i) => this.getPlaceholder(i)).join(', ');
    const sql = `INSERT INTO ${this.escapeIdentifier(table)} (${columns.map(c => this.escapeIdentifier(c)).join(', ')}) VALUES (${placeholders}) RETURNING *`;
    return { sql, params: values };
  }

  private buildUpdateQuery(table: string, pkField: string, pkValue: any, columns: string[], values: any[]): { sql: string; params: any[] } {
    const setClauses = columns.map((col, i) => `${this.escapeIdentifier(col)} = ${this.getPlaceholder(i)}`);
    const sql = `UPDATE ${this.escapeIdentifier(table)} SET ${setClauses.join(', ')} WHERE ${this.escapeIdentifier(pkField)} = ${this.getPlaceholder(columns.length)}`;
    return { sql, params: [...values, pkValue] };
  }

  private escapeIdentifier(identifier: string): string {
    switch (this.dbType) {
      case 'postgresql':
      case 'postgres':
        return `"${identifier}"`;
      case 'mysql':
        return `\`${identifier}\``;
      case 'sqlite':
        return `"${identifier}"`;
      default:
        return identifier;
    }
  }

  private getPlaceholder(index: number): string {
    switch (this.dbType) {
      case 'postgresql':
      case 'postgres':
        return `$${index + 1}`;
      case 'mysql':
      case 'sqlite':
        return '?';
      default:
        return '?';
    }
  }

  private getOperator(operator: string): string {
    switch (operator) {
      case 'eq': return '=';
      case 'ne': return '!=';
      case 'gt': return '>';
      case 'gte': return '>=';
      case 'lt': return '<';
      case 'lte': return '<=';
      case 'in': return 'IN';
      case 'notIn': return 'NOT IN';
      case 'contains': return 'LIKE';
      case 'startsWith': return 'LIKE';
      case 'endsWith': return 'LIKE';
      default: return '=';
    }
  }
}
