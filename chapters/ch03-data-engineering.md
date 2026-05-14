# 第 3 章：数据工程筑根基，ETL 艺术洗铅华

> **核心问题**：FDE 面对的第一个挑战永远是——数据
> **本章简介**：本章为读者夯实数据工程的根基。从 ETL 与 ELT 的范式之争到 Lambda 与 Kappa 的架构选择，从维度建模到大宽表设计，从 SQL 窗口函数到 Python 数据处理，再到数据集成与血缘追踪——读者将掌握 FDE 日常工作中最核心的数据处理能力。所有知识点均通过 AI-API-COMPASS 项目的真实场景进行演练。

---

## 3.1 数据工程师的日常

### 3.1.1 数据工程 vs 软件工程：不同的思维模式

数据工程和软件工程虽然都涉及代码编写，但它们的思维模式有着本质的区别：

| 维度 | 软件工程 | 数据工程 |
|------|----------|----------|
| **核心目标** | 构建功能正确的应用 | 确保数据可靠、可用 |
| **代码特性** | 确定性逻辑 | 概率性、容错性逻辑 |
| **状态管理** | 应用状态 | 数据状态、血缘关系 |
| **错误处理** | 快速失败 | 优雅降级、数据修复 |
| **测试重点** | 单元测试、集成测试 | 数据质量测试、管道测试 |
| **部署频率** | 频繁（CI/CD） | 谨慎（数据影响评估） |

FDE 需要同时具备这两种思维模式：在构建 Ontology 应用时像软件工程师一样思考，在处理数据集成时像数据工程师一样思考。

### 3.1.2 ETL vs ELT：两种数据集成范式

**ETL（Extract-Transform-Load）** 是传统数据仓库的核心模式：

```
数据源 → [提取] → 临时存储 → [转换] → 目标仓库
```

**ELT（Extract-Load-Transform）** 是现代云数据平台的趋势：

```
数据源 → [提取] → 目标仓库 → [转换]
```

| 特性 | ETL | ELT |
|------|-----|-----|
| **转换位置** | 专用服务器 | 目标数据库内 |
| **硬件要求** | 高性能 ETL 服务器 | 高性能数据仓库 |
| **灵活性** | 低（ Schema 变更困难） | 高（SQL 即可转换） |
| **适用场景** | 传统数据仓库 | 云原生数据湖 |
| **代表工具** | Informatica, Talend | dbt, BigQuery |

在 AI-API-COMPASS 中，我们采用了 **混合模式**：

```typescript
// backend/src/seed/aigc.seed.ts
// ELT 模式：先加载原始数据，再转换
async function seedAIGCTools() {
  // Extract: 从 JSON 文件读取
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);
  
  // Load: 直接加载到数据库
  for (const tool of data.tools) {
    await prisma.objects.create({
      data: {
        objectTypeId: aigcToolId,
        rid: `ri.aigc.main.object.aigc-tool.${tool.slug}`,
        properties: {
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          websiteUrl: tool.url,
          developer: tool.developer,
          pricingType: 'freemium',
        },
        status: 'active',
      },
    });
  }
  
  // Transform: 后续通过 Function 计算热度、排名等
  await calculateHeatScores();
  await updateRankings();
}
```

### 3.1.3 批处理 vs 流处理：Lambda vs Kappa 架构

**Lambda 架构** 结合了批处理和流处理：

```
数据源 → [批处理层] → 批处理视图
      → [速度层]   → 实时视图
      → [服务层]   → 合并查询
```

**Kappa 架构** 简化为纯流处理：

```
数据源 → [流处理层] → 统一视图
```

在 AI-API-COMPASS 中，我们采用了 **Lambda 架构的简化版**：

```typescript
// 批处理：每日计算排名
async function calculateDailyRankings() {
  const tools = await prisma.objects.findMany({
    where: { objectTypeId: aigcToolId },
  });
  
  for (const tool of tools) {
    const score = await calculateRankingScore(tool.rid);
    await prisma.ranking_snapshots.create({
      data: {
        toolRid: tool.rid,
        type: 'comprehensive',
        score,
        calculatedAt: new Date(),
      },
    });
  }
}

// 流处理：实时记录用户事件
async function trackUserEvent(toolRid: string, eventType: string) {
  await prisma.user_events.create({
    data: {
      toolRid,
      eventType,
      weight: getEventWeight(eventType),
      createdAt: new Date(),
    },
  });
  
  // 触发实时热度更新
  await updateHeatScore(toolRid, '24h');
}
```

### 3.1.4 数据质量：Garbage In, Garbage Out

数据质量是数据工程的生命线。在 AI-API-COMPASS 中，我们实施了多层数据质量保障：

```typescript
// backend/src/lib/analytics/event-validator.ts
export class EventValidator {
  validateEvent(event: UserEvent): ValidationResult {
    const errors: string[] = [];
    
    // 完整性检查
    if (!event.toolRid) errors.push('toolRid is required');
    if (!event.eventType) errors.push('eventType is required');
    
    // 有效性检查
    const validEventTypes = ['search', 'click', 'compare', 'bookmark', 'share', 'review'];
    if (!validEventTypes.includes(event.eventType)) {
      errors.push(`Invalid eventType: ${event.eventType}`);
    }
    
    // 一致性检查
    if (event.weight && (event.weight < 0 || event.weight > 10)) {
      errors.push('weight must be between 0 and 10');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

---

## 3.2 数据建模基础

### 3.2.1 关系模型：表、主键、外键、索引

关系模型是数据建模的基础。在 AI-API-COMPASS 的 Prisma Schema 中：

```prisma
// backend/prisma/schema.prisma
model objects {
  id           String       @id
  objectTypeId String
  rid          String?
  properties   Json         @default("{}")
  status       String       @default("active")
  
  object_types object_types @relation(fields: [objectTypeId], references: [id], onDelete: Cascade)
  
  @@unique([objectTypeId, rid])
  @@index([objectTypeId])
  @@index([status])
}

model links {
  id             String     @id
  linkTypeId     String
  sourceObjectId String
  targetObjectId String
  properties     Json       @default("{}")
  
  link_types     link_types @relation(fields: [linkTypeId], references: [id], onDelete: Cascade)
  
  @@unique([linkTypeId, sourceObjectId, targetObjectId])
  @@index([linkTypeId])
  @@index([sourceObjectId])
  @@index([targetObjectId])
}
```

### 3.2.2 维度建模：星型模式 vs 雪花模式

**星型模式**：事实表直接连接维度表

```
    [时间维度]
         |
[用户维度] — [事实表: 用户事件] — [工具维度]
         |           |
    [地域维度]   [事件类型维度]
```

**雪花模式**：维度表进一步规范化

```
    [时间维度]
         |
[用户维度] — [事实表: 用户事件] — [工具维度] — [提供商维度]
         |           |                  |
    [地域维度]   [事件类型维度]      [分类维度]
```

在 AI-API-COMPASS 中，我们采用了 **大宽表（OBT）** 模式，这是 Palantir 偏好的建模方式。

### 3.2.3 大宽表（OBT）：Palantir 偏好的建模方式

大宽表（One Big Table, OBT）将所有相关数据扁平化为一张表，简化了查询：

```prisma
// AI-API-COMPASS 中的大宽表设计
model tool_heat_snapshots {
  id            String   @id
  toolRid       String
  period        String
  heatScore     Float    @default(0)
  rawScore      Float    @default(0)
  eventCount    Int      @default(0)
  weightedScore Float    @default(0)
  decayFactor   Float    @default(1)
  trend         String   @default("stable")
  trendChange   Float    @default(0)
  previousScore Float?
  level         String   @default("FROZEN")
  levelIcon     String   @default("❄️")
  calculatedAt  DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime
  
  @@unique([toolRid, period])
  @@index([calculatedAt])
  @@index([heatScore])
}
```

### 3.2.4 Schema 推断：从脏数据中自动发现结构

```typescript
// backend/src/lib/schema-inferer.ts
export function inferSchemaFromData(data: any[]): PropertyV2[] {
  if (data.length === 0) return [];
  
  const sample = data[0];
  const properties: PropertyV2[] = [];
  
  for (const [key, value] of Object.entries(sample)) {
    const property: PropertyV2 = {
      apiName: key,
      displayName: key,
      dataType: inferDataType(value),
      required: data.every(item => item[key] !== undefined),
    };
    properties.push(property);
  }
  
  return properties;
}

function inferDataType(value: any): DataType {
  if (typeof value === 'string') {
    if (isDateString(value)) return { type: 'date' };
    if (isURL(value)) return { type: 'string', valueType: 'URL' };
    return { type: 'string' };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return { type: 'integer' };
    return { type: 'double' };
  }
  if (typeof value === 'boolean') return { type: 'boolean' };
  if (Array.isArray(value)) return { type: 'list', innerType: inferDataType(value[0]) };
  return { type: 'string' };
}
```

🎯 **实践环节**：分析 AI-API-COMPASS 的 Prisma Schema 设计

---

## 3.3 SQL 高级技巧

### 3.3.1 窗口函数：排名、聚合、前后行引用

```sql
-- 计算每个分类下工具的热度排名
SELECT 
  t.toolRid,
  t.heatScore,
  c.name as categoryName,
  RANK() OVER (PARTITION BY c.id ORDER BY t.heatScore DESC) as categoryRank,
  LAG(t.heatScore) OVER (ORDER BY t.heatScore DESC) as prevScore,
  LEAD(t.heatScore) OVER (ORDER BY t.heatScore DESC) as nextScore
FROM tool_heat_snapshots t
JOIN objects o ON t.toolRid = o.rid
JOIN links l ON o.id = l.sourceObjectId
JOIN objects c ON l.targetObjectId = c.id
WHERE t.period = '24h'
  AND t.calculatedAt >= NOW() - INTERVAL '1 day';
```

### 3.3.2 CTE 与递归查询：构建复杂查询管道

```sql
-- 递归查询：获取工具的所有相关工具（通过链接）
WITH RECURSIVE related_tools AS (
  -- 基础查询：直接相关的工具
  SELECT 
    l.sourceObjectId as toolId,
    l.targetObjectId as relatedToolId,
    1 as depth
  FROM links l
  WHERE l.sourceObjectId = 'obj-tool-123'
  
  UNION ALL
  
  -- 递归查询：间接相关的工具
  SELECT 
    rt.toolId,
    l.targetObjectId,
    rt.depth + 1
  FROM related_tools rt
  JOIN links l ON rt.relatedToolId = l.sourceObjectId
  WHERE rt.depth < 3  -- 限制递归深度
)
SELECT * FROM related_tools;
```

### 3.3.3 JSON 操作：PostgreSQL 的 JSONB 能力

```sql
-- 查询 properties JSONB 字段
SELECT 
  id,
  properties->>'name' as toolName,
  properties->>'pricingType' as pricingType,
  properties->'supportedModalities' as modalities
FROM objects
WHERE objectTypeId = 'ri.aigc.main.object-type.aigc-tool'
  AND properties->>'isPopular' = 'true';

-- 更新 JSONB 字段
UPDATE objects
SET properties = jsonb_set(
  properties,
  '{viewCount}',
  (COALESCE((properties->>'viewCount')::int, 0) + 1)::text::jsonb
)
WHERE id = 'obj-tool-123';
```

### 3.3.4 性能优化：执行计划分析与索引策略

```sql
-- 分析查询执行计划
EXPLAIN ANALYZE
SELECT * FROM objects
WHERE objectTypeId = 'ri.aigc.main.object-type.aigc-tool'
  AND properties->>'isPopular' = 'true'
ORDER BY properties->>'viewCount' DESC
LIMIT 10;

-- 创建 GIN 索引加速 JSONB 查询
CREATE INDEX idx_objects_properties ON objects USING GIN (properties);

-- 创建复合索引
CREATE INDEX idx_heat_snapshots_tool_period 
ON tool_heat_snapshots(toolRid, period, calculatedAt DESC);
```

🎯 **实践环节**：用 SQL 查询 AI-API-COMPASS 的工具排名数据

---

## 3.4 Python 数据处理

### 3.4.1 Pandas 基础：DataFrame 操作与数据清洗

```python
import pandas as pd
import numpy as np

# 读取 AI-API-COMPASS 数据
df = pd.read_json('aigc_tools_data.json')

# 数据清洗
df['pricingType'] = df['pricingType'].fillna('unknown')
df['startingPrice'] = pd.to_numeric(df['startingPrice'], errors='coerce')
df['releaseDate'] = pd.to_datetime(df['releaseDate'], errors='coerce')

# 数据转换
df['priceCategory'] = pd.cut(
    df['startingPrice'],
    bins=[0, 100, 500, 1000, float('inf')],
    labels=['免费/低价', '中价', '高价', '企业级']
)

# 分组聚合
category_stats = df.groupby('category').agg({
    'name': 'count',
    'startingPrice': ['mean', 'median'],
    'averageRating': 'mean'
}).round(2)
```

### 3.4.2 PySpark 入门：分布式数据处理

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, avg, count, window

spark = SparkSession.builder.appName("AIGCAnalytics").getOrCreate()

# 读取数据
df = spark.read.json("s3://aigc-data/user-events/")

# 计算每小时热度
df.groupBy(
    window(col("createdAt"), "1 hour"),
    col("toolRid")
).agg(
    count("*").alias("eventCount"),
    avg("weight").alias("avgWeight")
).write.parquet("s3://aigc-data/heat-hourly/")
```

### 3.4.3 数据清洗实战：处理编码混乱的 CSV、缺失值、重复数据

```python
import chardet

# 自动检测编码
with open('raw_data.csv', 'rb') as f:
    result = chardet.detect(f.read())
    encoding = result['encoding']

# 读取并清洗
df = pd.read_csv('raw_data.csv', encoding=encoding)

# 处理缺失值
df['description'] = df['description'].fillna('暂无描述')
df['developer'] = df['developer'].fillna('未知开发者')

# 处理重复数据
df = df.drop_duplicates(subset=['slug'], keep='first')

# 数据验证
assert df['slug'].is_unique, "slug 必须唯一"
assert df['name'].notna().all(), "name 不能为空"
```

### 3.4.4 数据验证：Schema 验证与异常检测

```typescript
// backend/src/lib/data-validator.ts
export class DataValidator {
  validateToolData(data: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    
    for (const [index, tool] of data.entries()) {
      // Schema 验证
      if (!tool.name) {
        errors.push({ row: index, field: 'name', message: '必填字段缺失' });
      }
      
      if (!tool.slug || !/^[a-z0-9-]+$/.test(tool.slug)) {
        errors.push({ row: index, field: 'slug', message: 'slug 格式无效' });
      }
      
      // 业务规则验证
      if (tool.pricingType === 'paid' && !tool.startingPrice) {
        errors.push({ row: index, field: 'startingPrice', message: '付费工具必须提供价格' });
      }
      
      // 异常检测
      if (tool.averageRating && (tool.averageRating < 0 || tool.averageRating > 5)) {
        errors.push({ row: index, field: 'averageRating', message: '评分超出范围' });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

🎯 **实践环节**：编写 AI-API-COMPASS 的数据清洗脚本

---

## 3.5 数据集成实战

### 3.5.1 数据源连接：数据库、API、文件、流

```typescript
// backend/src/connectors/base-connector.ts
export abstract class DataConnector {
  abstract connect(): Promise<void>;
  abstract fetch(): Promise<any[]>;
  abstract disconnect(): Promise<void>;
}

// API 连接器
export class APIConnector extends DataConnector {
  async fetch(): Promise<any[]> {
    const response = await fetch(this.config.url, {
      headers: this.config.headers,
    });
    return response.json();
  }
}

// 文件连接器
export class FileConnector extends DataConnector {
  async fetch(): Promise<any[]> {
    const data = fs.readFileSync(this.config.path, 'utf-8');
    return JSON.parse(data);
  }
}

// 数据库连接器
export class DatabaseConnector extends DataConnector {
  async fetch(): Promise<any[]> {
    return this.prisma.$queryRawUnsafe(this.config.query);
  }
}
```

### 3.5.2 变更数据捕获（CDC）：实时同步的底层机制

```typescript
// backend/src/sync/cdc-engine.ts
export class CDCEngine {
  async captureChanges(table: string, lastSync: Date): Promise<ChangeEvent[]> {
    const changes = await this.prisma.$queryRaw`
      SELECT * FROM ${table}
      WHERE updated_at > ${lastSync}
      ORDER BY updated_at ASC
    `;
    
    return changes.map(row => ({
      type: row.deleted_at ? 'DELETE' : row.created_at > lastSync ? 'INSERT' : 'UPDATE',
      table,
      data: row,
      timestamp: row.updated_at,
    }));
  }
}
```

### 3.5.3 数据血缘：追踪数据的来龙去脉

```typescript
// backend/src/lineage/lineage-tracker.ts
export class LineageTracker {
  async trackLineage(event: DataLineageEvent): Promise<void> {
    await prisma.lineage_records.create({
      data: {
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        targetType: event.targetType,
        targetId: event.targetId,
        transformation: event.transformation,
        timestamp: new Date(),
      },
    });
  }
  
  async getLineage(objectId: string): Promise<LineagePath[]> {
    // 递归查询血缘关系
    const paths = await prisma.$queryRaw`
      WITH RECURSIVE lineage AS (
        SELECT targetId, sourceId, transformation, 1 as depth
        FROM lineage_records
        WHERE targetId = ${objectId}
        
        UNION ALL
        
        SELECT lr.targetId, lr.sourceId, lr.transformation, l.depth + 1
        FROM lineage_records lr
        JOIN lineage l ON lr.targetId = l.sourceId
        WHERE l.depth < 10
      )
      SELECT * FROM lineage;
    `;
    
    return paths;
  }
}
```

### 3.5.4 Data as Code：用代码管理数据管道

```yaml
# data-pipeline.yml
pipelines:
  aigc-tool-sync:
    source:
      type: api
      url: https://api.aigc.cn/tools
      schedule: "0 */6 * * *"  # 每6小时
    
    transform:
      - name: validate
        type: schema_validation
        schema: aigc-tool-schema.json
      
      - name: enrich
        type: data_enrichment
        fields:
          - pricingType
          - category
    
    sink:
      type: ontology
      objectType: AIGCTool
      
    quality:
      - check: completeness
        threshold: 0.95
      - check: freshness
        maxAge: 6h
```

🎯 **实践环节**：实现 AI-API-COMPASS 的数据同步引擎

---

## 本章小结

本章系统性地介绍了 FDE 必备的数据工程基础：

1. **ETL vs ELT**：理解两种范式的适用场景
2. **Lambda vs Kappa**：选择合适的流批处理架构
3. **数据建模**：掌握关系模型、维度建模、大宽表
4. **SQL 高级技巧**：窗口函数、CTE、JSON 操作、性能优化
5. **Python 数据处理**：Pandas、PySpark、数据清洗、数据验证
6. **数据集成**：连接器模式、CDC、数据血缘、Data as Code

通过 AI-API-COMPASS 项目的实例，我们看到了这些理论知识如何落地到实际项目中。

📚 **推荐书籍**：《Designing Data-Intensive Applications》— Martin Kleppmann
