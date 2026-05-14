# AI API Compass Ontology 改进任务执行计划

> 基于与 Palantir Foundry Ontology 语义层/动力层的对比分析，制定本改进计划。
> 创建日期: 2026-05-13
> 目标: 逐步消除与 Palantir Ontology 标准的不一致，提升架构标准化程度。

---

## 总体目标

将 AI API Compass 的 Ontology 实现从"概念借鉴层"升级为"标准兼容层"，核心目标包括：

1. **语义层标准化**: Object/Property/Link/Value Type 定义与数据库 schema 深度对齐
2. **动力层标准化**: Action 和 Function 执行引擎实现声明式规则驱动
3. **事务与一致性**: 引入数据库级事务包裹和完整的副作用系统
4. **运行时多态**: Interface 层从类型约束升级为运行时多态支持

---

## Phase 1: 语义层基础重构 (P0 - 核心基础)

### 任务 1.1: Property 存储模型重构 — JSON Blob → 结构化列/索引
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 3-4 天
**负责人**: 待分配

**问题描述**:
当前 `objects.properties` 为单一 JSON 字段，所有属性扁平化存储。这与 Palantir OSv2 的列式存储设计不符，导致无法对属性建立索引、类型安全仅在应用层保障。

**执行步骤**:
- [ ] 1.1.1 调研 Prisma JSON 索引支持（PostgreSQL `jsonb` GIN 索引 vs 属性级列迁移）
- [ ] 1.1.2 设计属性级列存储方案：
  - 方案 A: 保持 JSON 但添加 GIN 索引 + 虚拟生成列
  - 方案 B: 迁移到 EAV (Entity-Attribute-Value) 模型
  - 方案 C: 混合模式：常用属性为独立列，扩展属性为 JSON
- [ ] 1.1.3 编写数据库迁移脚本（Prisma migration）
- [ ] 1.1.4 更新 `ObjectTypeV2.properties` 定义，添加 `storageType` 元数据
- [ ] 1.1.5 修改 `objects` Repository 层，支持属性级 CRUD
- [ ] 1.1.6 编写数据迁移脚本，将现有 JSON 数据无损迁移
- [ ] 1.1.7 更新所有查询逻辑，使用新的属性级索引
- [ ] 1.1.8 编写单元测试和集成测试

**验收标准**:
- [ ] `objects` 表支持对常用属性（slug, name, status 等）的数据库级索引查询
- [ ] 属性类型变更时，数据库 schema 同步变更
- [ ] 现有数据 100% 无损迁移
- [ ] 查询性能提升 ≥ 30%（针对属性过滤查询）

**依赖**: 无
**阻塞**: 任务 1.2, 1.3, 2.1, 2.2

---

### 任务 1.2: Object Type Backing Datasource 映射机制
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 2-3 天
**负责人**: 待分配

**问题描述**:
Palantir 中 Object Type 必须配置 Backing Datasources，实现 Ontology 与实际数据集的映射。当前项目中此概念缺失，Object Type 仅为纯类型定义。

**执行步骤**:
- [ ] 1.2.1 设计 `BackingDatasource` 类型定义（参考 Palantir `Datasource` 规范）
- [ ] 1.2.2 在 `ObjectTypeV2` 中添加 `backingDatasources` 字段
- [ ] 1.2.3 创建 `datasource_mappings` 数据库表，存储 Object Type 到实际表的映射
- [ ] 1.2.4 实现 Datasource 同步引擎：
  - 支持从 Prisma Model 自动同步为 Object Type
  - 支持手动配置映射关系
- [ ] 1.2.5 在 Ontology Manifest 中声明 Backing Datasource
- [ ] 1.2.6 编写同步验证逻辑，确保 Object Type 与实际表结构一致
- [ ] 1.2.7 添加 API 端点：管理 Datasource 映射

**验收标准**:
- [ ] 每个 Object Type 可配置一个或多个 Backing Datasource
- [ ] Datasource 映射变更时，自动验证结构一致性
- [ ] 提供 API 查询 Object Type 的 Datasource 信息
- [ ] 文档更新：说明 Datasource 映射机制

**依赖**: 无
**阻塞**: 任务 2.1

---

### 任务 1.3: Link Type 存储模型重构
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 2-3 天
**负责人**: 待分配

**问题描述**:
当前所有 Link Type 共享单一 `links` 表，MANY_TO_MANY 无独立数据源。Palantir 要求 MANY_TO_MANY Link Type 有独立的连接表。

**执行步骤**:
- [ ] 1.3.1 移除 Link Type 中的 `linkKind` 自定义字段（技术泄漏）
- [ ] 1.3.2 重构 `links` 表：
  - ONE_TO_ONE / ONE_TO_MANY: 通过外键属性实现（Foreign Key Property）
  - MANY_TO_MANY: 每个 Link Type 创建独立连接表
- [ ] 1.3.3 编写 Prisma migration，创建独立连接表
- [ ] 1.3.4 实现 Link Type 到数据库表的自动映射
- [ ] 1.3.5 更新 Link CRUD Repository 层
- [ ] 1.3.6 数据迁移：将现有 `links` 表数据分发到各独立表
- [ ] 1.3.7 更新 `tool-link-types.ts`，移除 `linkKind`、`joinTableDatasetRid` 等非标准字段
- [ ] 1.3.8 统一 Link Type 方向性语义：使用 `sourceObjectType` / `targetObjectType`

**验收标准**:
- [ ] MANY_TO_MANY Link Type 有独立连接表
- [ ] 非多对多 Link 通过外键属性实现，无独立连接表
- [ ] `linkKind`、`joinTable*` 等非标准字段已移除
- [ ] 现有 Link 数据 100% 无损迁移

**依赖**: 任务 1.1
**阻塞**: 任务 2.2, 3.2

---

### 任务 1.4: Value Type 约束运行时强制执行
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 2 天
**负责人**: 待分配

**问题描述**:
Value Type 约束（enum、regex、range）仅在定义层声明，无运行时强制执行。

**执行步骤**:
- [ ] 1.4.1 设计 Value Type 验证引擎
- [ ] 1.4.2 实现约束验证器：
  - `enum`: 值必须在选项列表中
  - `regex`: 字符串匹配正则表达式
  - `range`: 数值在 min/max 范围内
  - `array`: 数组元素唯一性、元素约束
- [ ] 1.4.3 在 Object 创建/更新时，自动触发 Value Type 验证
- [ ] 1.4.4 在 Action 参数提交时，触发 Value Type 验证
- [ ] 1.4.5 添加数据库级 CHECK 约束（如 PostgreSQL `CHECK`）
- [ ] 1.4.6 编写验证错误信息国际化支持
- [ ] 1.4.7 单元测试：覆盖所有约束类型

**验收标准**:
- [ ] 违反 Value Type 约束时，操作被拒绝并返回清晰错误
- [ ] 约束验证在应用层和数据库层双重保障
- [ ] 验证错误信息包含字段名、约束类型、实际值

**依赖**: 任务 1.1
**阻塞**: 无

---

## Phase 2: 动力层核心重构 (P0 - 核心基础)

### 任务 2.1: 声明式 Rules 引擎实现
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 5-7 天
**负责人**: 待分配

**问题描述**:
当前 Action 执行完全为硬编码（`switch(apiName)`），Palantir 使用声明式 Rules 引擎。这是最关键的不一致。

**执行步骤**:
- [ ] 2.1.1 设计 Rule 类型系统（对齐 Palantir 规范）：
  - `CreateObjectRule`: 创建指定类型的新对象
  - `ModifyObjectRule`: 修改现有对象属性
  - `CreateOrModifyObjectRule`: 修改或创建
  - `DeleteObjectRule`: 删除对象
  - `CreateLinkRule`: 创建多对多链接
  - `DeleteLinkRule`: 删除链接
  - `FunctionRule`: 引用 Ontology Function
- [ ] 2.1.2 实现 Rule 编译器：将声明式 Rules 编译为执行计划
- [ ] 2.1.3 实现 Rule 执行引擎：
  - 参数映射：From parameter / Object parameter property / Static value / Current User/Time
  - 对象定位：通过对象引用参数定位目标对象
  - 编辑合并：对同一对象的多个编辑合并为单个编辑
- [ ] 2.1.4 替换 `action-executor.ts` 中的硬编码逻辑
- [ ] 2.1.5 更新 `aigc-action-types.ts`，使用标准 `rules` 字段替代 `operations`
- [ ] 2.1.6 实现 Rule 执行的可观测性（日志、指标）
- [ ] 2.1.7 编写 Rules 引擎单元测试（覆盖所有 Rule 类型）
- [ ] 2.1.8 编写集成测试（端到端 Action 执行）

**验收标准**:
- [ ] 所有 Action Type 使用声明式 Rules 定义，无硬编码
- [ ] Rules 引擎支持参数映射、对象定位、编辑合并
- [ ] 同一 Action 中多个 Rule 对同一对象的编辑正确合并
- [ ] 执行日志包含每个 Rule 的执行结果

**依赖**: 任务 1.1, 1.2, 1.3
**阻塞**: 任务 2.2, 2.3, 2.4, 2.5

---

### 任务 2.2: Function 与 Ontology 对象系统集成
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 4-5 天
**负责人**: 待分配

**问题描述**:
当前 Function 完全绕过 Ontology 层，直接操作 Prisma。需要实现类似 Palantir 的 `Objects.search()`、`Objects.create()` 等第一方 API。

**执行步骤**:
- [ ] 2.2.1 设计 Ontology Object API（模拟 Palantir `@foundry/functions-api`）：
  - `Objects.search(objectTypeApiName).filter(...)`
  - `Objects.create().objectType(properties)`
  - `object.property = value`（属性更新）
  - `object.link.set(target)` / `object.link.add(target)` / `object.link.remove(target)`
  - `object.delete()`
- [ ] 2.2.2 实现 `Objects` 命名空间：
  - `Objects.search()`: 返回 ObjectSet，支持链式过滤
  - `Objects.create()`: 创建新对象实例
- [ ] 2.2.3 实现 `ObjectSet` 类：
  - `filter()`: 基于属性过滤
  - `searchAround(linkType)`: 链接遍历（最多 3 层）
  - `union()` / `intersect()` / `subtract()`: 集合运算
  - `orderBy()` / `take()`: 排序和限制
  - `all()` / `allAsync()`: 检索所有对象
- [ ] 2.2.4 实现 Ontology Edit Function 装饰器：
  - `@OntologyEditFunction()`
  - `@Edits(ObjectType[])`
- [ ] 2.2.5 重构 `FunctionExecutor`，使用新的 Ontology API
- [ ] 2.2.6 更新所有现有 Function 实现，迁移到 Ontology API
- [ ] 2.2.7 编写 ObjectSet 操作单元测试

**验收标准**:
- [ ] Function 中可通过 `Objects.search()` 查询 Ontology 对象
- [ ] Function 中可通过 `object.property = value` 更新属性
- [ ] Function 中可通过链接 API 遍历关系
- [ ] Ontology Edit Function 装饰器正确捕获编辑意图
- [ ] 所有现有 Function 迁移完成，测试通过

**依赖**: 任务 1.1, 1.3, 2.1
**阻塞**: 无

---

### 任务 2.3: Function Rule 在 Action 中的支持
**状态**: ⏳ 未开始
**优先级**: P1
**预估工时**: 2-3 天
**负责人**: 待分配

**问题描述**:
Palantir 支持在 Action Type 中直接引用 Function Rule。当前 `action-executor.ts` 未处理 `functionRule` 字段。

**执行步骤**:
- [ ] 2.3.1 在 Rule 类型系统中添加 `FunctionRule`
- [ ] 2.3.2 实现 Function Rule 执行逻辑：
  - 参数映射：Action 参数 → Function 参数
  - Function 执行：调用 FunctionExecutor
  - 编辑捕获：收集 Ontology Edit Function 产生的编辑
- [ ] 2.3.3 在 Rules 引擎中集成 Function Rule
- [ ] 2.3.4 更新 `trackToolViewActionType` 等使用 Function Rule 的 Action
- [ ] 2.3.5 编写 Function Rule 集成测试

**验收标准**:
- [ ] Action Type 中可配置 Function Rule
- [ ] Function Rule 执行时，正确传递参数
- [ ] Ontology Edit Function 在 Action 上下文中正确应用编辑
- [ ] Function Rule 与其他 Rule 类型可组合使用

**依赖**: 任务 2.1, 2.2
**阻塞**: 无

---

### 任务 2.4: Submission Criteria 引擎完善
**状态**: ⏳ 未开始
**优先级**: P1
**预估工时**: 2-3 天
**负责人**: 待分配

**问题描述**:
当前 Submission Criteria 仅支持简单的字段验证，缺少 Palantir 的复杂条件组合能力。

**执行步骤**:
- [ ] 2.4.1 设计完整的 Criteria 类型系统：
  - 条件模板：`CurrentUserCondition` / `ParameterCondition`
  - 单值运算符：`is` / `is not` / `matches` / `is less than` / `is greater than or equals`
  - 多值运算符：`includes` / `includes any` / `is included in` / `each is` / `each is not`
  - 逻辑运算符：`AND` / `OR` / `NOT`（支持嵌套）
- [ ] 2.4.2 实现 Criteria 评估引擎
- [ ] 2.4.3 实现条件值来源解析：
  - `Current User`: 用户 ID、组成员身份
  - `Parameter`: 参数值、参数的属性值、列表长度
- [ ] 2.4.4 支持嵌套逻辑组合（树形结构评估）
- [ ] 2.4.5 每个条件和根级运算符支持独立失败消息
- [ ] 2.4.6 更新 `aigc-action-types.ts` 中的 submissionCriteria 定义
- [ ] 2.4.7 编写 Criteria 引擎单元测试

**验收标准**:
- [ ] 支持所有 Palantir 标准比较运算符
- [ ] 支持 AND/OR/NOT 嵌套逻辑
- [ ] 条件失败时返回精确的失败消息
- [ ] Current User 条件可检查用户属性和组成员身份

**依赖**: 任务 2.1
**阻塞**: 无

---

### 任务 2.5: 事务与回滚机制完善
**状态**: ⏳ 未开始
**优先级**: P0
**预估工时**: 2-3 天
**负责人**: 待分配

**问题描述**:
当前 Action 执行无数据库事务包裹，回滚逻辑仅覆盖 `submitReview`。

**执行步骤**:
- [ ] 2.5.1 在 Action 执行中引入 `prisma.$transaction`
- [ ] 2.5.2 设计 Action 事务上下文：
  - 事务开始 → Rule 逐个执行 → 提交/回滚
- [ ] 2.5.3 实现自动回滚机制：
  - 记录事务前对象状态（快照）
  - 失败时自动恢复到快照状态
- [ ] 2.5.4 确保 Writeback Webhook 在事务内执行
- [ ] 2.5.5 实现 Side Effect 的尽力而为执行（事务外）
- [ ] 2.5.6 添加事务超时控制
- [ ] 2.5.7 编写事务测试（成功提交、失败回滚、并发场景）

**验收标准**:
- [ ] 所有 Action 执行在数据库事务内完成
- [ ] 任一 Rule 失败时，整个 Action 自动回滚
- [ ] 回滚后数据状态与执行前完全一致
- [ ] 并发 Action 执行不互相干扰

**依赖**: 任务 2.1
**阻塞**: 无

---

## Phase 3: 副作用与集成层完善 (P1 - 重要增强)

### 任务 3.1: Side Effects 系统完整实现
**状态**: ⏳ 未开始
**优先级**: P1
**预估工时**: 3-4 天
**负责人**: 待分配

**问题描述**:
当前 Side Effects 实现不完整，缺少 Notification、Writeback/Side Effect Webhook 区分。

**执行步骤**:
- [ ] 3.1.1 设计 Side Effect 类型系统：
  - `NotificationSideEffect`: 平台内通知 + 邮件
  - `WebhookWritebackSideEffect`: 对象变更前执行，事务性
  - `WebhookSideEffectSideEffect`: 对象变更后执行，尽力而为
  - `ActionLogSideEffect`: 操作日志
- [ ] 3.1.2 实现 Notification 系统：
  - 模板方式：Subject（250字符）、Body（1000字符）、Link
  - 函数方式：返回 `Notification` 对象
  - 接收者配置：Static / From parameter / From object property / From Function
- [ ] 3.1.3 实现 Webhook 系统：
  - Writeback Webhook: 事务内执行，失败阻止变更，每个 Action 仅 1 个
  - Side Effect Webhook: 事务外执行，失败不影响变更，可多个
  - 输出参数传递：Writeback 输出可用于后续 Rules
- [ ] 3.1.4 重构 `writeback-webhook.ts`，支持两种 Webhook 类型
- [ ] 3.1.5 更新 `action-executor.ts`，集成完整 Side Effects 系统
- [ ] 3.1.6 编写 Side Effects 集成测试

**验收标准**:
- [ ] 支持 Notification、Writeback Webhook、Side Effect Webhook
- [ ] Writeback Webhook 失败时，Action 事务回滚
- [ ] Side Effect Webhook 失败不影响已完成的变更
- [ ] Writeback 输出参数可在后续 Rules 中使用

**依赖**: 任务 2.1, 2.5
**阻塞**: 无

---

### 任务 3.2: Interface 运行时多态支持
**状态**: ⏳ 未开始
**优先级**: P1
**预估工时**: 3-4 天
**负责人**: 待分配

**问题描述**:
当前 Interface 仅为类型约束，无运行时多态能力。

**执行步骤**:
- [ ] 3.2.1 设计 Interface 运行时系统：
  - Interface 实现验证：对象类型必须包含所有必需共享属性
  - Interface 实现注册：`interface_implementations` 表
- [ ] 3.2.2 实现 Interface 实现验证逻辑：
  - 检查对象类型是否包含接口定义的所有必需属性
  - 检查链接类型约束是否满足
- [ ] 3.2.3 实现通过接口查询对象：
  - `Objects.search('IIndexable').filter(...)` 返回所有实现该接口的对象
  - 支持跨对象类型的聚合和排序
- [ ] 3.2.4 实现接口属性访问：
  - 通过接口 API 名称引用对象、属性和链接
- [ ] 3.2.5 更新 `aigc-interfaces.ts`，使用标准 `sharedProperties`（非本地 properties）
- [ ] 3.2.6 编写 Interface 多态测试

**验收标准**:
- [ ] 对象类型实现接口时，自动验证必需属性
- [ ] 可通过接口 API 名称查询所有实现对象
- [ ] 接口查询支持过滤、排序、聚合
- [ ] 新增实现接口的对象类型，现有查询自动兼容

**依赖**: 任务 1.1, 1.3, 2.2
**阻塞**: 无

---

### 任务 3.3: Object Set Service 实现
**状态**: ⏳ 未开始
**优先级**: P1
**预估工时**: 3-4 天
**负责人**: 待分配

**问题描述**:
Palantir 提供丰富的 Object Set 操作（filter、searchAround、union、intersect 等）。当前项目无此抽象。

**执行步骤**:
- [ ] 3.3.1 设计 ObjectSet API：
  - `filter()`: 基于可搜索属性过滤
  - `searchAround(linkType)`: 链接遍历（最多 3 层）
  - `union()` / `intersect()` / `subtract()`: 集合运算
  - `orderBy()` / `take()`: 排序和限制
  - `groupBy()`: 聚合分组
- [ ] 3.3.2 实现字符串属性过滤：
  - `exactMatch()` / `phrase()` / `prefixOnLastToken()` / `fuzzyMatchAnyToken()`
- [ ] 3.3.3 实现数值/日期过滤：`range()` 支持 `.lt()` / `.lte()` / `.gt()` / `.gte()`
- [ ] 3.3.4 实现链接过滤：`isPresent()` 过滤有/无链接的对象
- [ ] 3.3.5 实现组合过滤：`Filters.and()` / `Filters.or()` 嵌套
- [ ] 3.3.6 实现 Search Around（最多 3 层遍历）
- [ ] 3.3.7 编写 ObjectSet 操作测试

**验收标准**:
- [ ] 支持所有标准 ObjectSet 操作
- [ ] Search Around 支持最多 3 层链接遍历
- [ ] 过滤操作利用数据库索引
- [ ] 结果集上限符合 Palantir 标准（1000 万对象）

**依赖**: 任务 1.1, 1.3, 2.2
**阻塞**: 无

---

## Phase 4: 性能与可观测性 (P2 - 优化增强)

### 任务 4.1: 查询性能优化
**状态**: ⏳ 未开始
**优先级**: P2
**预估工时**: 2-3 天
**负责人**: 待分配

**执行步骤**:
- [ ] 4.1.1 分析现有查询性能瓶颈
- [ ] 4.1.2 为常用查询属性添加数据库索引
- [ ] 4.1.3 实现查询结果缓存层（Redis）
- [ ] 4.1.4 实现 ObjectSet 查询的延迟加载和分页
- [ ] 4.1.5 优化 Search Around 的 JOIN 查询
- [ ] 4.1.6 添加查询性能指标收集

**验收标准**:
- [ ] 常用查询响应时间 < 100ms（P95）
- [ ] Search Around 3 层遍历响应时间 < 500ms
- [ ] 缓存命中率 > 70%

**依赖**: 任务 1.1, 3.3
**阻塞**: 无

---

### 任务 4.2: 可观测性与监控
**状态**: ⏳ 未开始
**优先级**: P2
**预估工时**: 2 天
**负责人**: 待分配

**执行步骤**:
- [ ] 4.2.1 设计 Ontology 执行指标：
  - Action 执行次数、成功率、平均耗时
  - Rule 执行次数、各类型分布
  - Function 调用次数、缓存命中率
- [ ] 4.2.2 实现执行日志结构化输出
- [ ] 4.2.3 集成 Prometheus 指标导出
- [ ] 4.2.4 实现分布式追踪（OpenTelemetry）
- [ ] 4.2.5 添加健康检查端点

**验收标准**:
- [ ] 所有 Action/Function 执行有结构化日志
- [ ] 关键指标可通过 Prometheus 抓取
- [ ] 支持分布式追踪，可追踪跨服务调用链

**依赖**: 任务 2.1, 2.2
**阻塞**: 无

---

## Phase 5: 文档与兼容性 (P2 - 收尾完善)

### 任务 5.1: Ontology SDK 开发
**状态**: ⏳ 未开始
**优先级**: P2
**预估工时**: 3-4 天
**负责人**: 待分配

**执行步骤**:
- [ ] 5.1.1 设计 Ontology SDK API（TypeScript）
- [ ] 5.1.2 实现 SDK 核心：
  - 对象类型安全访问
  - 链接遍历类型安全
  - Action 参数类型推断
- [ ] 5.1.3 生成 SDK 类型定义（基于 Ontology Manifest）
- [ ] 5.1.4 编写 SDK 使用文档和示例

**验收标准**:
- [ ] SDK 提供完整的类型安全
- [ ] 支持从 Ontology Manifest 自动生成类型
- [ ] 文档包含所有 API 的使用示例

**依赖**: 任务 2.2, 3.2, 3.3
**阻塞**: 无

---

### 任务 5.2: 文档全面更新
**状态**: ⏳ 未开始
**优先级**: P2
**预估工时**: 2 天
**负责人**: 待分配

**执行步骤**:
- [ ] 5.2.1 更新 `docs/ONTOLOGY_ARCHITECTURE.md`，反映新架构
- [ ] 5.2.2 更新 `docs/ontology.md`，与实现保持一致
- [ ] 5.2.3 编写开发者指南：如何定义 Object Type、Action Type、Function
- [ ] 5.2.4 编写迁移指南：从旧版本升级到新版本
- [ ] 5.2.5 编写 API 参考文档

**验收标准**:
- [ ] 所有文档与代码实现一致
- [ ] 新开发者可通过文档独立上手
- [ ] 迁移指南覆盖所有破坏性变更

**依赖**: 所有 Phase 1-4 任务
**阻塞**: 无

---

## 任务依赖图

```
Phase 1: 语义层基础重构
├── 1.1 Property 存储模型重构
│   ├── → 1.3 Link Type 重构
│   ├── → 1.4 Value Type 约束
│   ├── → 2.1 Rules 引擎
│   ├── → 2.2 Function Ontology API
│   └── → 3.3 ObjectSet Service
├── 1.2 Object Type Datasource 映射
│   └── → 2.1 Rules 引擎
├── 1.3 Link Type 重构
│   ├── → 2.2 Function Ontology API
│   ├── → 3.2 Interface 多态
│   └── → 3.3 ObjectSet Service
└── 1.4 Value Type 约束

Phase 2: 动力层核心重构
├── 2.1 Rules 引擎
│   ├── → 2.3 Function Rule
│   ├── → 2.4 Submission Criteria
│   ├── → 2.5 事务机制
│   ├── → 3.1 Side Effects
│   └── → 4.2 可观测性
├── 2.2 Function Ontology API
│   ├── → 2.3 Function Rule
│   ├── → 3.2 Interface 多态
│   ├── → 3.3 ObjectSet Service
│   └── → 5.1 SDK
├── 2.3 Function Rule
├── 2.4 Submission Criteria
└── 2.5 事务机制
    └── → 3.1 Side Effects

Phase 3: 副作用与集成层
├── 3.1 Side Effects
├── 3.2 Interface 多态
└── 3.3 ObjectSet Service
    └── → 4.1 性能优化

Phase 4: 性能与可观测性
├── 4.1 性能优化
└── 4.2 可观测性

Phase 5: 文档与兼容性
├── 5.1 SDK
└── 5.2 文档更新
```

---

## 执行顺序建议

### 第一波（并行）: 语义层基础
- 任务 1.1（Property 存储重构）
- 任务 1.2（Datasource 映射）
- 任务 1.4（Value Type 约束）

### 第二波（依赖第一波）: Link 与 Rules 引擎
- 任务 1.3（Link Type 重构）
- 任务 2.1（Rules 引擎）

### 第三波（依赖第二波）: Function 与事务
- 任务 2.2（Function Ontology API）
- 任务 2.5（事务机制）
- 任务 2.4（Submission Criteria）

### 第四波（依赖第三波）: 副作用与多态
- 任务 2.3（Function Rule）
- 任务 3.1（Side Effects）
- 任务 3.2（Interface 多态）
- 任务 3.3（ObjectSet Service）

### 第五波（收尾）: 性能、SDK、文档
- 任务 4.1（性能优化）
- 任务 4.2（可观测性）
- 任务 5.1（SDK）
- 任务 5.2（文档更新）

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据迁移失败 | 高 | 迁移前完整备份；分阶段迁移；提供回滚脚本 |
| 性能退化 | 中 | 每个重构任务包含性能基准测试；灰度发布 |
| API 兼容性破坏 | 高 | 保持旧 API 兼容层；提供迁移指南；版本化发布 |
| 开发周期延长 | 中 | 按 Phase 分阶段交付；每个 Phase 可独立发布 |
| 测试覆盖不足 | 高 | 每个任务强制要求单元测试；集成测试覆盖核心流程 |

---

## 附录: 不一致点与任务映射

| 不一致点 | 对应任务 | Phase |
|---------|---------|-------|
| #1 Object Type 无数据源映射 | 1.2 | 1 |
| #2 Property 与数据库 schema 脱节 | 1.1 | 1 |
| #3 Link Type `linkKind` 自定义扩展 | 1.3 | 1 |
| #4 MANY_TO_MANY 无独立数据源 | 1.3 | 1 |
| #5 Link 方向性语义偏差 | 1.3 | 1 |
| #6 Value Type 约束无强制执行 | 1.4 | 1 |
| #7 Interface 无运行时多态 | 3.2 | 3 |
| #8 `operations` 与 `rules` 语义不匹配 | 2.1 | 2 |
| #9 Action 执行引擎硬编码 | 2.1 | 2 |
| #10 缺少 Function Rule 支持 | 2.3 | 2 |
| #11 Function 执行方式完全不同 | 2.2 | 2 |
| #12 Function 与 Ontology 对象脱节 | 2.2 | 2 |
| #13 Submission Criteria 大幅简化 | 2.4 | 2 |
| #14 Side Effects 实现不完整 | 3.1 | 3 |
| #15 事务语义存在根本差异 | 2.5 | 2 |
