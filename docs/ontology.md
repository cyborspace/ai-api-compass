# Palantir Foundry Ontology 三层架构 -- 全面结构化总结

> 文档版本: 2025年5月 | 基于 Palantir Foundry 官方文档

---

## 概述

Palantir Foundry **Ontology** 是一个**运营层（Operational Layer）**，构建在 Foundry 中集成的数字资产（[datasets](https://www.palantir.com/docs/foundry/data-integration/datasets/)、[virtual tables](https://www.palantir.com/docs/foundry/data-integration/virtual-tables/)、[models](https://www.palantir.com/docs/foundry/integrate-models/integrate-overview/)）之上，将它们与现实世界的对应物连接起来——从物理资产（如工厂、设备、产品）到概念（如客户订单或金融交易）。

在许多场景中，Ontology 充当组织的**数字孪生（Digital Twin）**，包含支持各种用例所需的语义元素（对象、属性、链接）和动力元素（Actions、Functions、动态安全）。

Ontology 的核心目标是：**促进组织内的大规模决策制定**。

### 核心特征

- **超越数据目录**：不仅仅是数据目录或模式设计解决方案
- **细粒度安全与治理**：为所有变更提供细粒度的安全和治理
- **端到端工作流基础**：为终端用户工作流提供坚实基础
- **实时应用驱动**：数据资产通过真实应用驱动实际业务流程

### 架构三层模型

```
+--------------------------------------------------+
|         Interface Layer (接口层) [Beta]            |
|    Interface → Shared Properties + Link Constraints |
|    Interface Implementation → Object Type 映射      |
+--------------------------------------------------+
                          |
                          | 实现 (implements)
                          v
+--------------------------------------------------+
|              Semantic Layer (语义层)                |
|    Object Type → Properties + Primary Keys         |
|    Link Type → Cardinality + Foreign Keys          |
|    Shared Property → 跨对象类型复用                  |
|    Value Type → 语义包装器 + 验证约束               |
|    Backing Datasources → 数据源映射                 |
+--------------------------------------------------+
                          |
                          | 读写 (read/write)
                          v
+--------------------------------------------------+
|              Kinetic Layer (动力层)                 |
|    Action Type → Parameters + Rules + Criteria     |
|    Function → Query / Edit Logic                   |
|    Side Effects → Notifications + Webhooks         |
|    Submission Criteria → 条件验证 + 逻辑运算符      |
+--------------------------------------------------+
```

---

## 第一层：语义层 (Semantic Layer) -- 对象与链接

语义层定义了组织的语义结构，通过将现有数据源映射为 Ontology 中的**对象（Objects）、属性（Properties）和链接（Links）**来实现。

### 1.1 对象类型 (Object Type)

**对象类型**是现实世界实体或事件的**模式定义（Schema Definition）**。**对象（Object）**是对象类型的单个实例，对应单个现实世界实体或事件。**对象集（Object Set）**是多个对象实例的集合。

#### 类比理解

| Ontology 概念 | 数据集类比 |
|--------------|-----------|
| 对象类型定义 | 数据集的模式定义 |
| 对象 (Object) | 数据集中的一行 (Row) |
| 对象集 (Object Set) | 经过筛选的行集合 |

#### 对象类型元数据字段

| 字段 | 类型 | 说明 |
|------|------|------|
| rid | string (自动生成) | Palantir 中每个资源的唯一标识符 |
| displayName | string | 在用户应用中显示的名称 |
| description | string | 解释性文本描述 |
| apiName | string | 在代码中编程引用时使用的名称 |
| status | enum: active \| experimental \| deprecated \| example | 资源的开发状态信号 |
| icon | Icon | 用于在应用中显示的图片和颜色标识 |
| primaryKeys | PropertyReference[] | 主键属性引用列表（每个对象类型必须至少有一个） |
| titleKeys | PropertyReference[] | 标题键属性引用列表（用于显示对象的简短标题） |
| properties | PropertyDefinition[] | 属性定义列表 |
| backingDatasources | Datasource[] | 支撑此对象类型的数据源列表 |
| typeClasses | TypeClass[] | 可被应用解释的附加元数据类型类 |

#### 示例

- **Employee 对象类型**：定义"所有员工"的特征，单个对象如 "Melissa Chang"、"Akriti Patel"
- **Flight 对象类型**：定义"所有航班"的特征，单个对象如 "JFK → SFO 2021-02-24"

---

### 1.2 属性定义 (Property Definition)

**属性**是对象类型上某个特征的**模式定义**。**属性值（Property Value）**是该特征在某个对象实例上的具体值。

#### 示例

- **Employee** 对象类型可能有属性：`employee number`、`start date`、`role`
- 员工 "Melissa Chang" 的属性值：
  - `employee number` = "11502"
  - `start date` = "October 9, 2016"
  - `role` = "software engineer"

#### 属性定义字段

| 字段 | 类型 | 说明 |
|------|------|------|
| apiName | string | 属性的编程引用名称 |
| displayName | string | 属性的显示名称 |
| description | string | 属性的描述 |
| baseType | BaseType | 属性的基础数据类型 |
| valueType | ValueType (可选) | 语义包装器，提供额外的类型安全和验证约束 |
| isPrimaryKey | boolean | 是否为主键 |
| isTitleKey | boolean | 是否为标题键 |
| isShared | boolean | 是否为共享属性 |
| status | enum: active \| experimental \| deprecated \| example | 属性状态 |
| renderHints | RenderHint[] | 渲染提示，控制属性在应用中的行为 |

#### 支持的属性基础类型 (Base Types)

| 基础类型 | 可作为标题键 | 可作为主键 | 备注 |
|----------|-------------|-----------|------|
| **常用类型** |
| String | 是 | 是 | |
| Integer | 是 | 是 | |
| Short | 是 | 是 | |
| **时间类型** |
| Date (LocalDate) | 是 | 不推荐 | 时间值通常不适合作为主键，因为存储格式与显示格式可能导致意外的冲突/唯一性问题 |
| Timestamp | 是 | 不推荐 | 建议使用 String 替代 |
| **数值类型** |
| Boolean | 是 | 不推荐 | Boolean 限制对象类型只有两个实例 |
| Byte | 是 | 不推荐 | Byte 属性只能通过 Integer 参数在 Actions 中赋值，建议使用 Integer |
| Long | 是 | 不推荐 | JavaScript 中 Long 有表示问题（大于 1e15 的值），建议使用 String |
| Float | 是 | 否 | |
| Double | 是 | 否 | |
| Decimal | 是 | 否 | 在 Object Storage V2 中不支持 |
| **地理空间类型** |
| Geohash | 是 | 否 | |
| Geopoint | 是 | 否 | |
| Geoshape | 否 | 否 | |
| **高级类型** |
| Vector | 否 | 否 | 用于语义搜索，维度限制 2048 |
| Array | 是(取决于内部类型) | 否 | 内部类型不能为 Vector 或 Time Series；Array 不能包含 null 元素；不支持嵌套数组 |
| Struct | 否 | 否 | 不支持嵌套，字段不能是数组 |
| Media Reference | 否 | 否 | |
| Time Series | 否 | 否 | |
| Attachment | 否 | 否 | |
| Marking | 否 | 否 | |
| Cipher | 是 | 否 | |

#### 渲染提示 (Render Hints)

渲染提示控制属性在应用中的行为，**只有启用 `Searchable` 渲染提示的属性才能用于过滤、排序和聚合**。

| 渲染提示 | 说明 | 添加原始索引 | 需要重新索引 |
|----------|------|-------------|-------------|
| **Searchable** | 启用搜索功能 | 是 | 是 |
| **Selectable** | 允许聚合操作 | 是 | 是（需同时启用 Searchable） |
| **Sortable** | 允许排序操作 | 是 | 是（需同时启用 Searchable） |
| **Low cardinality** | 指示属性值种类不多 | 是 | 是（需同时启用 Searchable） |
| Identifier | 改善重新索引性能 | 否 | 否 |
| Keywords | 在 Object Views 中突出显示 | 否 | 否 |
| Long text | 属性值包含大量文本 | 否 | 否 |
| Disable formatting | 禁用本地数字格式化 | 否 | 否 |

#### TypeScript 中的属性类型元数据

```typescript
// 从 @foundry/ontology-api 导入
BooleanPropertyBaseType
BytePropertyBaseType
DatePropertyBaseType
FloatPropertyBaseType
TimestampPropertyBaseType
ShortPropertyBaseType
GeohashPropertyBaseType
DecimalPropertyBaseType
StringPropertyBaseType
LongPropertyBaseType
IntegerPropertyBaseType
DoublePropertyBaseType
ArrayPropertyBaseType
VectorPropertyBaseType
```

---

### 1.3 共享属性 (Shared Property) [Beta]

**共享属性**是可以在**多个对象类型上使用的属性**，允许跨对象类型进行一致的数据建模和集中化的属性元数据管理。

#### 关键特征

- **元数据共享**：属性元数据在对象之间共享，但底层的对象数据**不共享**
- **创建方式**：可以直接创建，也可以从现有属性转换而来
- **视觉标识**：在 Ontology Manager 中以**地球图标**标识

#### 使用场景

例如，`Employee` 和 `Contractor` 对象类型都有 `start date` 属性。通过创建 `start date` 共享属性并在两个对象类型上使用，可以：
- 使用一致的属性进行数据建模
- 在一个地方更新 `start date` 元数据，而不是在每个对象类型上分别更新

---

### 1.4 值类型 (Value Types)

**值类型**是围绕字段类型的**语义包装器**，包含元数据和约束，可增强类型安全性、提高表达力并提供额外的上下文。

#### 关键特征

- **封装领域特定数据类型**：如电子邮件地址、URL、UUID、枚举
- **强制执行数据验证**：在整个平台中强制执行数据验证
- **Space 关联**：与 Space 关联，只能在定义它们的 Space 内使用
- **版本控制**：支持版本控制（区分破坏性变更和非破坏性变更）
- **权限控制**：有权限控制

#### 示例

用户可以定义一个 **"email" 值类型**，带有正则表达式约束以确保任何使用该值类型的属性都表示有效的电子邮件地址。该值类型可以在多个对象类型和 Pipeline 中重用，无需为每个属性重复验证逻辑。

---

### 1.5 链接类型 (Link Type)

**链接类型**是两个对象类型之间**关系的模式定义**。**链接（Link）**是该关系在两个具体对象之间的单个实例。

#### 示例

- **Employee → Company**：定义员工与雇主之间的关系
- **Flight → Aircraft**：定义计划航班与分配飞机之间的关系
- **Employee ↔ Employee (Direct Report ↔ Manager)**：同一对象类型之间的链接

#### 链接类型元数据字段

| 字段 | 类型 | 说明 |
|------|------|------|
| rid | string (自动生成) | 唯一标识符 |
| displayName | string | 显示名称 |
| description | string | 描述 |
| apiName | string | 编程引用名称 |
| status | enum: active \| experimental \| deprecated \| example | 状态 |
| sourceObjectType | ObjectType | 源对象类型 |
| targetObjectType | ObjectType | 目标对象类型 |
| cardinality | enum: ONE_TO_ONE \| ONE_TO_MANY \| MANY_TO_MANY | 基数 |
| visibility | enum: prominent \| hidden | 可见性（prominent 会优先显示，hidden 不在应用中显示） |
| backingDatasources | Datasource[] | 支撑数据源（仅多对多链接类型有独立的数据源） |
| foreignKeyProperty | PropertyReference (仅非多对多) | 外键属性引用 |
| typeClasses | TypeClass[] | 附加元数据类型类 |

#### 基数 (Cardinality) 详解

| 基数 | 说明 | 实现方式 |
|------|------|----------|
| **ONE_TO_ONE** | 源对象类型的一个对象最多链接到目标对象类型的一个对象 | 通过外键属性实现 |
| **ONE_TO_MANY** | 源对象类型的一个对象可以链接到目标对象类型的多个对象 | 通过外键属性实现 |
| **MANY_TO_MANY** | 多个源对象可以链接到多个目标对象 | 链接类型本身有独立的数据源（连接表） |

#### 链接类型约束

- ❌ 不支持跨不同 Ontology 的对象类型之间的链接
- ✅ 支持同一对象类型到自身的链接（如 Employee <-> Manager）

#### TypeScript API 中的链接类型

```typescript
// SingleLink<T> -- 一对一或一对多中的"一"端
employee.supervisor.get()        // 获取链接的对象
employee.supervisor.getAsync()   // 异步获取
employee.supervisor.set(object)  // 设置链接
employee.supervisor.clear()      // 清除链接

// MultiLink<T> -- 一对多或多对多中的"多"端
employee.reports.all()           // 获取所有链接的对象数组
employee.reports.allAsync()      // 异步获取
employee.reports.add(object)     // 添加链接
employee.reports.remove(object)  // 移除链接
```

---

### 1.6 对象类型组 (Object Type Groups)

对象类型组是一种**分类原语**，帮助用户更好地搜索和探索其 Ontology。

---

### 1.7 状态 (Status)

每个 Ontology 资源（对象类型、属性、链接类型、Action、接口）都有一个状态：

| 状态 | 说明 |
|------|------|
| **active** | 资源正在用户应用中积极使用，不会有重大破坏性变更 |
| **experimental** | 资源仍在开发中，可能会进行破坏性变更 |
| **deprecated** | 资源即将被删除，包含弃用原因、删除截止日期和替代资源 |
| **example** | 资源作为示例安装，仅适用于培训或探索性使用 |

---

## 第二层：动力层 (Kinetic Layer) -- Actions 与 Functions

动力层定义了组织的**动态行为**，使用 **Action Types** 和 **Functions** 来实现变更，同时遵守组织控制和治理规则。

### 2.1 Action Type (动作类型)

**Action Type** 是用户可以一次性对对象、属性值和链接进行的一组变更或编辑的**模式定义**。**Action** 是基于用户定义逻辑改变一个或多个对象属性的**单个事务**。

#### 示例

**Assign Employee Action Type**：
- 允许用户更改给定 Employee 对象的 `role` 属性值
- 可以包含参数定义，使用户能够以标准化表单输入新角色
- 可以包含规则，自动创建 Employee 对象与新 Manager 之间的链接
- 可以包含通知副作用，通知旧经理和新经理此变更
- 可以验证授权员工（如人力资源部门）是否可以执行此 Action

#### Action Type 结构字段

| 字段/组件 | 类型 | 说明 |
|----------|------|------|
| rid | string | 唯一标识符 |
| displayName | string | 显示名称 |
| description | string | 描述 |
| apiName | string | 编程引用名称 |
| status | enum | 状态 |
| parameters | Parameter[] | 参数定义列表（Action 的输入接口） |
| rules | Rule[] | 规则列表（定义 Action 的逻辑） |
| submissionCriteria | SubmissionCriterion[] | 提交标准（决定 Action 是否可以提交的条件） |
| sideEffects | SideEffect[] | 侧效应（通知、Webhook） |
| permissions | PermissionConfig | 权限配置 |

---

### 2.2 参数 (Parameters)

**参数**是 Action Type 的**输入**，是 **Rules** 和其他 Foundry 应用（如 Workshop、Slate、Object Views）之间的接口。参数被视为包含外部值的变量。

#### 参数类型

| 参数类型 | 说明 |
|----------|------|
| string | 字符串 |
| integer | 整数 |
| boolean | 布尔值 |
| date / timestamp | 日期/时间戳 |
| object reference | 对象引用（引用特定对象类型的单个对象） |
| object reference list | 对象引用列表（引用特定对象类型的多个对象） |
| object set | 对象集 |
| attachment | 附件 |
| user / group | Foundry 用户/组 |

#### 参数配置选项

| 配置项 | 说明 |
|--------|------|
| displayName | 显示名称 |
| description | 描述 |
| type | 参数类型 |
| required | 是否必填 |
| defaultValue | 默认值 |
| hidden | 是否在表单中隐藏 |
| readOnly | 是否只读（用户不可修改） |
| exposedInForm | 是否在表单中暴露 |

#### 参数值来源（在 Rules 中使用时）

- **From parameter**：来自同类型的现有参数
- **Object parameter property**：来自对象引用参数的某个属性
- **Static value**：静态值（在 Workshop/Slate 中不可交互）
- **Current User/Time**：当前用户或提交时间的上下文值

---

### 2.3 规则 (Rules)

**规则**定义 Action Type 的逻辑，将参数转换为 Ontology 编辑或其他效果。

#### 2.3.1 Ontology 规则

| 规则类型 | 说明 | 关键配置 |
|----------|------|----------|
| **Create object** | 创建指定类型的新对象 | 主键（必填）、附加属性（可选）、可同时创建多对多链接 |
| **Modify object(s)** | 修改现有对象的属性 | 通过对象引用参数定位对象、指定要修改的属性及其值 |
| **Create or modify object(s)** | 修改现有对象或创建新对象 | 基于对象引用参数；如果未选择对象，则创建新对象（自动生成唯一 ID 或使用用户提交的主键） |
| **Delete object(s)** | 删除现有对象 | 通过对象引用参数定位对象 |
| **Create link(s)** | 创建多对多链接 | 通过对象引用参数指定两端对象 |
| **Delete link** | 删除多对多链接 | 通过对象引用参数指定两端对象 |
| **Function Rule** | 引用 Ontology 编辑函数 | 函数输入从 Action 参数派生；使用此规则时不能配置其他规则 |
| **Create object(s) of interface** | 创建实现特定接口的任何类型的对象 | 支持接口多态性 |
| **Modify object(s) of interface** | 修改实现特定接口的对象 | 支持接口多态性 |
| **Delete object(s) of interface** | 删除实现特定接口的对象 | 支持接口多态性 |

#### 规则值映射方式

- **From parameter**：来自参数值
- **Object parameter property**：来自对象参数的属性
- **Static value**：静态值
- **Current User/Time**：上下文值
- **Writeback response**：来自 Webhook 写回的输出参数

#### 规则组合约束

- 对象不能在被添加或修改之前被删除
- 对象不能在被添加之前被修改
- 对象不能在一次表单提交中被创建两次
- 多个规则编译为对每个对象的单个编辑（后定义的规则覆盖先定义的）

#### 2.3.2 侧效应规则 (Side Effect Rules)

| 规则类型 | 说明 |
|----------|------|
| **Notification** | 发送通知（平台内推送通知和/或邮件） |
| **Webhook (Writeback)** | 在对象变更之前执行外部请求；失败则阻止所有变更 |
| **Webhook (Side Effect)** | 在对象变更之后执行外部请求；失败不影响已完成的变更 |

---

### 2.4 提交标准 (Submission Criteria)

**提交标准**是决定 Action 是否可以提交的条件。支持将基于上下文（如用户或参数）的条件与静态信息组合成逻辑语句。

#### 条件模板

| 模板 | 可用的值来源 |
|------|-------------|
| **Current User** | 用户 ID、组成员身份（Group IDs）、Multipass 属性 |
| **Parameter** | 参数值、参数的属性值、列表长度 |

#### 单值比较运算符

| 运算符 | 说明 |
|--------|------|
| is | 左值精确匹配右值 |
| is not | 左值和右值不匹配 |
| matches | 左值匹配正则表达式 |
| is less than | 左值小于右值 |
| is greater than or equals | 左值大于等于右值 |

#### 多值比较运算符

| 运算符 | 说明 |
|--------|------|
| includes | 左值中至少有一个匹配右值 |
| includes any | 左值和右值中至少有一个共同值 |
| is included in | 左值精确匹配右值中的至少一个 |
| each is | 所有左值都匹配右值 |
| each is not | 所有左值都不匹配右值 |

#### 逻辑运算符

- **AND**：所有条件都必须满足
- **OR**：任一条件满足即可
- **NOT**：条件取反
- 支持嵌套

#### 失败消息

每个条件和根级逻辑运算符都有自己的失败消息，当条件不满足时显示给最终用户。

---

### 2.5 通知 (Notifications)

#### 通知配置字段

| 配置项 | 说明 |
|--------|------|
| Recipients | 接收者配置 |
| Content | 内容配置（模板或函数） |

#### 接收者指定方式

| 方式 | 说明 |
|------|------|
| **Static** | 配置中选择的固定用户或组 |
| **From parameter** | 来自 Action 参数中的 Foundry 用户/组 ID |
| **From object parameter property** | 来自对象参数中包含用户/组 ID 的属性 |
| **From Function** | 自定义函数返回接收者列表（最多 50 个接收者） |

#### 内容配置（模板方式）

| 组件 | 说明 | 限制 |
|------|------|------|
| Subject | 主题行 | 最多 250 字符 |
| Body | 正文内容 | 最多 1,000 字符 |
| Link | 可选链接 | 可链接到对象参数、Workshop 应用、Carbon 工作区、新创建的对象 |
| Advanced Email Configuration | 邮件的自定义 HTML 内容 | 最多 51,200 字符 |

#### 内容配置（函数方式）

函数返回 `Notification` 对象，包含：
- **ShortNotification**：平台内通知（heading, content, links）
- **EmailNotificationContent**：邮件通知（subject, body as HTML, links）

#### 接收者限制

- **模板内容**：最多 500 个接收者
- **函数内容**：最多 50 个接收者

---

### 2.6 Webhook

#### Webhook 配置字段

| 配置项 | 说明 |
|--------|------|
| type | writeback 或 side effect |
| inputParameters | 输入参数（映射到 Action 参数或使用函数） |
| outputParameters | 输出参数（仅 writeback 可用，可在后续规则中使用） |

#### Webhook 类型对比

| 类型 | 执行时机 | 失败是否显示给用户 | 数量限制 |
|------|----------|-------------------|----------|
| **Writeback** | 对象变更之前 | 是 | 每个 Action 仅 1 个 |
| **Side Effect** | 对象变更之后 | 否 | 每个 Action 可多个 |

#### Writeback Webhooks

- 在其他规则评估**之前**执行
- 如果 Webhook 执行失败，**不会进行任何其他更改**
- 保证一定程度的**事务性**：外部系统请求失败时，Foundry Ontology 不会应用更改
- 输出参数可在后续规则中使用

#### Side Effect Webhooks

- 在其他规则评估**之后**执行
- Foundry 对象修改**先于**副作用应用
- 可以配置**多个**副作用 Webhook，执行顺序不保证
- 可以通过提供**payload 列表**从单个 Action 多次调用
- 适用于发送尽力而为的通知或写回到多个外部系统

---

### 2.7 Function (函数)

**Functions** 允许代码作者编写可以在操作上下文中**快速执行**的逻辑，在隔离的服务器端环境中运行。

#### 常见用例

- 返回对象集或变量值供 [Workshop](https://www.palantir.com/docs/foundry/workshop/functions-use/) 使用
- 在派生表列中显示转换值（Workshop 的 Function-backed Columns）
- 聚合对象类型值以显示为 Workshop 图表
- 通过 [Function-backed Action](https://www.palantir.com/docs/foundry/action-types/function-actions-overview/) 表达更新多个对象的复杂 Ontology 编辑
- 在 [Slate](https://www.palantir.com/docs/foundry/slate/overview/) 中运行后端逻辑返回信息到前端显示
- 计算自定义指标或聚合供 [Quiver](https://www.palantir.com/docs/foundry/quiver/overview/) 显示
- 通过 [external Functions](https://www.palantir.com/docs/foundry/functions/webhooks/) 查询外部系统以丰富 Ontology 中的对象

#### 支持语言

- **TypeScript**
- **Python [Beta]**

#### Function 分类

| 类型 | 装饰器 | 返回类型 | 说明 |
|------|--------|----------|------|
| **Query Function** | `@Function()` | 任意类型 | 查询函数，返回计算结果 |
| **Ontology Edit Function** | `@OntologyEditFunction()` + `@Edits(ObjectType[])` | void | 编辑函数，修改 Ontology 对象 |

#### Function 功能支持对比（TypeScript vs Python）

| Functions 能力 | TypeScript | Python | 说明 |
|----------------|------------|--------|------|
| Ontology 对象支持 | ✅ | ✅ | 在 Function 中访问 Ontology 对象 |
| Ontology 编辑支持 | ✅ | ✅ | 在 Function 中编辑 Ontology 对象 |
| Workshop 中可查询 | ✅ | ✅ | 从 Workshop 应用调用 Function |
| Pipeline Builder 中可调用 | ❌ | ✅ | 从 Pipeline Builder 管道调用 Function |
| 模型上的 Functions | ✅ | ❌ | 编写可嵌入模型的 Functions |
| 语义搜索支持 | ✅ | ❌ | 使用 Functions 创建向量进行语义搜索 |
| 外部 API 调用 | ✅ | ✅ | 从 Functions 内查询外部服务 |
| Serverless 执行 | ✅ | ✅ | 按需启动的无服务器 Function |
| Deployed 执行 | ❌ | ✅ | 有专用资源分配的部署 Function |
| API Gateway 调用 | ✅ | ✅ | 从 API 网关调用查询 Function |
| Marketplace 支持 | ✅ | ❌ | 通过 Marketplace 打包和发布 Functions |

#### Function 执行限制

| 限制项 | Serverless Function | Deployed Function |
|--------|---------------------|-------------------|
| **总时间** | 60 秒（30 秒 CPU + 30 秒网络缓冲） | 60 秒 |
| **对象集加载上限** | 100,000 个对象（超过 10,000 可能超时） | 100,000 个对象 |
| **Search Around 深度** | 最多 3 层 | 最多 3 层 |
| **聚合限制** | 最多 10,000 个桶 | 最多 10,000 个桶 |

#### Function 支持的输入/输出类型

**标量类型**：
- `boolean`, `string`
- `Integer`, `Long`, `Float`, `Double`（从 `@foundry/functions-api` 导入）
- `LocalDate`, `Timestamp`

**可选类型**：
- 输入参数：`varName?: <type>`
- 返回类型：`<type> | undefined`

**集合类型**：
- `List`：ES6 Arrays（如 `string[]`），支持嵌套（如 `Integer[][]`）
- `Set`：ES6 Sets（如 `Set<string>`）
- `Map`：`FunctionsMap<K, V>`，键可以是标量类型或 Ontology 对象

**聚合类型**：
- `TwoDimensionalAggregation<TKey>`：单维度桶聚合
- `ThreeDimensionalAggregation<TKey1, TKey2>`：双维度桶聚合

**Ontology 类型**：
- `Object`：单个对象（客户端传递 objectRid 或主键）
- `Object[]` / `Set<Object>`：对象数组/集合
- `ObjectSet<ObjectType>`：对象集（支持过滤、搜索、聚合）

**用户和组类型**：
- `User`：包含 username, firstName, lastName, email
- `Group`：包含 name
- `Principal`：可以是 User 或 Group，包含 id, realm, attributes

**通知类型**：
- `Notification`：包含 ShortNotification 和 EmailNotificationContent
- `ShortNotification`：heading, content, links
- `EmailNotificationContent`：subject, body (HTML), links
- `Link`：label + linkTarget (URL / OntologyObject / rid)

**自定义类型**：
- TypeScript 接口或内联匿名类型
- 字段可以是任何上述类型、其他自定义类型或自引用

#### Ontology Edit Function API

```typescript
// 创建对象
const newTicket = Objects.create().ticket(ticketId);

// 更新属性
employee.lastName = newName;

// 更新链接
employee.supervisor.set(newSupervisor);    // 设置一对一
employee.supervisor.clear();                // 清除一对一
employee.reports.add(newReport);            // 添加一对多
employee.reports.remove(oldReport);         // 移除一对多

// 删除对象
ticket.delete();
```

#### Ontology Edit Function 重要说明

**何时应用编辑**：
- 在 Functions helper 中运行 Ontology Edit Function 时，**不会**实际修改对象数据
- 只有通过配置为 Action 使用 Function 时，才能更新对象

**编辑如何捕获**：
- 所有对象更新由 Functions 基础设施捕获并在 Function 执行结束时返回
- 编辑被智能合并以最小化编辑集
- 整个 Function 必须成功才能生成传递给 Actions 服务的编辑列表

**编辑与对象搜索的注意事项**：
- 对对象和链接的更改在 Function 执行**之后**才传播到 `Objects.search()` API
- 搜索、过滤、Search Arounds 和聚合可能不反映 Ontology 的编辑
- 如果通过 `Objects.search()` 检索已编辑的对象，将返回编辑后的值

---

## 第三层：接口层 (Interface Layer) [Beta]

接口层提供对象类型的**多态性**，允许对共享公共形状的对象类型进行一致的建模和交互。

### 3.1 接口 (Interface)

**接口**是描述对象类型形状及其能力的 Ontology 类型。

#### 示例

**Facility 接口**：
- 包含 `Facility Name` 和 `Location` 属性
- 可由 `Airport`、`Manufacturing Plant`、`Maintenance Hangar` 等对象类型实现
- 这些对象类型可以包含额外的类型特定属性

通过使用 `Facility` 接口，工作流可以与 `Airport`、`Manufacturing Plant` 和 `Maintenance Hangar` 对象类型交互（聚合或独立），而无需了解这些对象类型的具体细节。此外，如果引入实现 `Facility` 接口的新对象类型，工作流将立即兼容，无需额外重构。

#### 接口元数据字段

| 字段 | 类型 | 说明 |
|------|------|------|
| rid | string (自动生成) | 唯一标识符 |
| icon | Icon | 带虚线边框的图片和颜色标识（与对象类型视觉区分） |
| displayName | string | 显示名称 |
| description | string | 描述 |
| apiName | string | 编程引用名称 |
| status | enum: active \| experimental \| deprecated | 状态（默认 experimental） |
| sharedProperties | SharedProperty[] | 组成接口的共享属性列表 |
| interfaceLinkTypes | InterfaceLinkType[] | 接口链接类型约束列表 |
| extendedInterfaces | Interface[] | 扩展的父接口列表（可扩展任意数量的其他接口） |

#### 接口与对象类型的区别

| 特征 | 对象类型 | 接口 |
|------|----------|------|
| **具体性** | 具体 | 抽象 |
| **属性定义** | 共享属性或本地属性 | 仅共享属性 |
| **数据源支撑** | 有 | 无 |
| **可实例化** | 可以 | 不可以 |
| **图标样式** | 实线边框 | 虚线边框 |

#### 接口类型分类

| 类型 | 说明 | 示例 |
|------|------|------|
| **能力接口 (Capability Interface)** | 代表一种独特能力 | Schedulable Resource（可调度资源） |
| **抽象对象接口 (Abstract Object Interface)** | 代表多个对象类型的"超类型" | Employee（由 Full Time Employee、Intern、Contractor 实现） |

#### 接口功能

- 由**共享属性**、**链接类型约束**和**元数据**组成
- 可由**多个对象类型实现**
- 支持**扩展接口**创建子接口，继承原始接口的属性
- 对象类型可以实现**多个接口**
- 接口可以**扩展多个其他接口**（包括本身扩展其他接口的接口），实现多层属性继承

---

### 3.2 接口链接类型 (Interface Link Type)

**接口链接类型约束**定义了所有实现该接口的对象类型之间共有的对象到对象关系。

#### 接口链接类型约束字段

| 字段 | 类型 | 说明 |
|------|------|------|
| apiName | string | 链接类型的编程引用名称 |
| description | string | 描述 |
| linkTargetType | enum: interface \| object type | 链接目标类型 |
| target | Interface \| ObjectType | 具体的目标接口或对象类型 |
| cardinality | enum: ONE \| MANY | 基数（一对一或一对多） |
| required | boolean | 是否为实现所必需 |

---

### 3.3 接口实现 (Interface Implementation)

对象类型可以**实现一个或多个接口**。实现接口意味着对象类型符合接口定义的形状。

#### 实现要求

- 对象类型必须包含接口定义的**所有必需共享属性**
- 对象类型必须有满足**所有必需接口链接类型约束**的具体链接类型
- 当通过接口与对象交互时，可以通过**本地 API 名称**和**任何实现的接口的 API 名称**来引用对象、属性和链接

---

### 3.4 接口当前支持水平

| 平台/服务 | 支持状态 |
|----------|----------|
| **Ontology Manager** | ✅ 已支持 |
| **Marketplace** | ✅ 已支持 |
| **Actions** | ⚠️ 部分支持（可定义创建/修改/删除实现接口的对象的 Actions；不能直接引用接口链接类型约束，但可以引用用于实现接口链接类型的具体链接类型） |
| **Object Set Service** | ⚠️ 部分支持（可按接口搜索和排序对象；按接口聚合正在开发中；接口链接类型支持正在开发中） |
| **Ontology SDK** | ⚠️ 部分支持（TypeScript 已支持；Java 和 Python 支持正在开发中；接口链接类型和聚合在任何语言中尚未支持） |
| **Workshop** | ❌ 尚未支持 |
| **Functions** | ❌ 尚未支持 |

---

## 其他 Ontology 概念

### 对象集 (Object Set)

**对象集**表示同一类型的对象的**无序集合**。支持的操作包括：

| 操作 | 说明 |
|------|------|
| `filter()` | 基于可搜索属性过滤 |
| `searchAround()` | 基于链接类型遍历到其他对象类型（最多 3 层） |
| `union()` / `intersect()` / `subtract()` | 集合运算 |
| `all()` / `allAsync()` | 检索所有对象（最多 100,000 个） |
| `orderBy()` / `orderByRelevance()` | 排序 |
| `take()` / `takeAsync()` | 限制返回数量 |
| `groupBy()` | 聚合分组 |
| `nearestNeighbors()` | KNN 向量搜索（k <= 100） |

#### 对象集过滤方法

**字符串属性过滤**：
- `.exactMatch()`：精确匹配
- `.phrase()`：短语匹配（分词后按顺序匹配）
- `.phrasePrefix()`：短语前缀匹配
- `.prefixOnLastToken()`：最后一词前缀匹配
- `.matchAnyToken()` / `.fuzzyMatchAnyToken()`：匹配任意词（模糊版本允许近似值）
- `.matchAllTokens()` / `.fuzzyMatchAllTokens()`：匹配所有词

**数值/日期/时间戳属性过滤**：
- `.range()`：范围过滤，支持 `.lt()`, `.lte()`, `.gt()`, `.gte()`

**布尔属性过滤**：
- `.isTrue()` / `.isFalse()`

**地理空间属性过滤**：
- Geohash：`.withinDistanceOf()`, `.withinPolygon()`, `.withinBoundingBox()`
- GeoShape：`.withinBoundingBox()`, `.intersectsBoundingBox()`, `.doesNotIntersectBoundingBox()`, `.withinPolygon()`, `.intersectsPolygon()`, `.doesNotIntersectPolygon()`

**链接过滤**：
- `.isPresent()`：过滤有/无特定类型链接对象的对象

**数组属性过滤**：
- `.contains()`：过滤数组属性包含给定值的对象

**组合过滤**：
```typescript
import { Filters } from "@foundry/functions-api";

Objects.search()
    .flights()
    .filter(flight => Filters.or(
        Filters.and(flight.destination.exactMatch("SFO"), flight.passengerCount.gt(100)),
        Filters.and(flight.destination.exactMatch("LAX"), flight.passengerCount.gt(300)),
    ))
```

---

### Object Storage V2 (OSv2)

Foundry 的**现代对象存储后端**，Ontology 的属性和链接数据存储在此。

#### Search Around 限制

- 从对象集 A Search Around 到对象集 B 时，结果对象集 B 不能超过 **1000 万个对象实例**（OSv2）
- OSv1 限制为 **10 万个对象实例**

---

### Writeback Dataset (写回数据集)

当用户通过 Action 对 Ontology 进行编辑时，所有变更都会提交到对象类型的**写回数据集**，反映最新的对象数据状态。

---

### Ontology SDK

提供对 Ontology 的**编程访问**，支持 **TypeScript、Python 和 Java**。

---

### Marketplace

允许**打包和安装 Ontology 资源**（包括接口），实现跨组织的 Ontology 共享。

---

## Ontology 感知应用 (Ontology-Aware Applications)

Foundry 包含多个原生运行在 Ontology 之上的应用，共同提供支持各种用例和用户画像的强大分析和运营平台。

### 应用参考

| 应用 | 主要用例 | 工作流风格 | 配置模型 | 数据类型 |
|------|----------|-----------|----------|----------|
| **Object Views** | 发现 | 工作流特定 | 即用型 | Objects |
| **Object Explorer** | 发现与分析 | 探索型 | 即用型 | Objects |
| **Quiver** | 分析与仪表板 | 探索型（分析模式）；工作流特定（仪表板模式） | 即用型（分析模式）；可定制（仪表板模式） | Objects |
| **Workshop** | 应用与仪表板 | 工作流特定 | 可定制 | Objects |
| **Slate** | 应用与仪表板（复杂） | 工作流特定 | 可定制 | Objects（推荐）和 Datasets |
| **Map** | 地理空间 | 探索型或工作流特定 | 即用型 | Objects |

### 应用详细说明

#### Object Views

对象的**中央信息枢纽**，包含：
- 对象的"传记数据"
- 所有链接对象
- 关键相关指标
- 相关分析、仪表板和工作流的链接（或嵌入）

#### Object Explorer

用于回答有关 Ontology 层任何问题的**搜索和分析工具**：
- 可视化组合搜索查询（从简单过滤到 Search Arounds）
- 使用探索视图或结果表探索对象集
- 比较和对比对象集
- 对对象集执行批量 Actions
- 导出对象集或在兼容应用中打开

#### Quiver

通过可视化点击界面和强大的图表库实现**高级分析工作流**：
- 支持从简单线性钻取分析到高度分支复杂分析
- 原生时间序列分析
- 可模板化为只读仪表板供更广泛消费

#### Workshop

在 Ontology 层上**无代码构建应用**：
- 利用高质量 Layouts
- 使用复杂但易用的 Events 系统
- 目标是与自定义 React 应用一样用户友好和高质量

#### Slate

需要更多技术配置和代码的**灵活应用构建器**：
- 可与 Ontology 层交互，也可直接与 Foundry 数据集交互
- 基于 Web 开发范式实现显著视觉定制
- 功能广泛，但比 Workshop 需要更多技术知识

#### Carbon

将多个资源或应用组合成**高度定制的工作空间**：
- 组合分析结果（仪表板）
- Workshop 或 Slate 构建的应用
- 开箱即用功能（Object Views、Object Explorer）

#### Map

在**地理空间上下文**中汇集和分析对象及其他数据。

---

## 总结架构图

```
+--------------------------------------------------+
|         Interface Layer (接口层) [Beta]            |
|  Interface -> Shared Properties + Link Constraints |
|  Interface Implementation -> Object Type 映射      |
|  支持: Ontology Manager, Marketplace               |
|  部分支持: Actions, Object Set Service, SDK        |
|  不支持: Workshop, Functions                       |
+--------------------------------------------------+
                          |
                          | 实现 (implements)
                          v
+--------------------------------------------------+
|              Semantic Layer (语义层)                |
|  Object Type -> Properties + Primary Keys          |
|  Link Type -> Cardinality + Foreign Keys           |
|  Shared Property -> 跨对象类型复用                  |
|  Value Type -> 语义包装器 + 验证约束               |
|  Backing Datasources -> 数据集/虚拟表/模型映射      |
+--------------------------------------------------+
                          |
                          | 读写 (read/write)
                          v
+--------------------------------------------------+
|              Kinetic Layer (动力层)                 |
|  Action Type -> Parameters + Rules + Criteria      |
|  Function -> Query / Edit Logic                   |
|  Side Effects -> Notifications + Webhooks          |
|  Submission Criteria -> 条件验证 + 逻辑运算符      |
+--------------------------------------------------+
                          |
                          | 驱动应用
                          v
+--------------------------------------------------+
|           Ontology-Aware Applications               |
|  Object Views, Object Explorer, Quiver            |
|  Workshop, Slate, Carbon, Map                     |
+--------------------------------------------------+
```

---

## 数据来源

以上所有信息均来自 Palantir Foundry 官方文档，包括：

- [Ontology Overview](https://www.palantir.com/docs/foundry/ontology/overview/)
- [Object Types Overview](https://www.palantir.com/docs/foundry/object-link-types/object-types-overview/)
- [Link Types Overview](https://www.palantir.com/docs/foundry/object-link-types/link-types-overview/)
- [Properties Overview](https://www.palantir.com/docs/foundry/object-link-types/properties-overview/)
- [Action Types Overview](https://www.palantir.com/docs/foundry/action-types/overview/)
- [Functions Overview](https://www.palantir.com/docs/foundry/functions/overview/)
- [Interfaces Overview](https://www.palantir.com/docs/foundry/interfaces/interface-overview/)
- [Rules](https://www.palantir.com/docs/foundry/action-types/rules/)
- [Parameters](https://www.palantir.com/docs/foundry/action-types/parameter-overview/)
- [Notifications](https://www.palantir.com/docs/foundry/action-types/notifications/)
- [Webhooks](https://www.palantir.com/docs/foundry/action-types/webhooks/)
- [Ontology Edits](https://www.palantir.com/docs/foundry/functions/edits-overview/)
- [Object Sets API](https://www.palantir.com/docs/foundry/functions/api-object-sets/)
- [Ontology Edits API](https://www.palantir.com/docs/foundry/functions/api-ontology-edits/)
- [Shared Properties](https://www.palantir.com/docs/foundry/object-link-types/shared-property-overview/)
- [Value Types](https://www.palantir.com/docs/foundry/object-link-types/value-types-overview/)
- [Ontology-Aware Applications](https://www.palantir.com/docs/foundry/ontology/applications/)
