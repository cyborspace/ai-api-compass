# 数据集成层 (Data Integration Layer)

## 概述

实现 Palantir Foundry 风格的多源数据集成能力，支持：
1. **多源数据集成** - 连接多种外部数据源
2. **双向同步** - 数据变更回写源系统
3. **实时计算** - 流式数据处理和推送

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Integration Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Connectors  │  │ Sync Engine │  │ Real-time Engine    │ │
│  │             │  │             │  │                     │ │
│  │ • REST API  │  │ • Full Sync │  │ • Event Stream      │ │
│  │ • Database  │  │ • Increment │  │ • WebSocket Push    │ │
│  │ • File      │  │ • Scheduled │  │ • Change Data Capture│ │
│  │ • GraphQL   │  │ • Real-time │  │ • Materialized Views│ │
│  │ • WebSocket │  │             │  │                     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │            │
│  ┌──────▼────────────────▼────────────────────▼──────────┐ │
│  │              Data Source Registry                       │ │
│  │         (管理所有数据源连接和配置)                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. 数据源连接器 (Connectors)

- `BaseConnector` - 连接器基类
- `RestApiConnector` - REST API 连接器
- `DatabaseConnector` - 数据库连接器
- `FileConnector` - 文件连接器
- `GraphQLConnector` - GraphQL 连接器
- `WebSocketConnector` - WebSocket 连接器

### 2. 同步引擎 (Sync Engine)

- `SyncEngine` - 同步引擎主类
- `FullSyncStrategy` - 全量同步策略
- `IncrementalSyncStrategy` - 增量同步策略
- `ChangeDetector` - 变更检测器

### 3. 实时引擎 (Real-time Engine)

- `EventStream` - 事件流
- `ChangeDataCapture` - 变更数据捕获
- `WebSocketPublisher` - WebSocket 推送
- `MaterializedView` - 物化视图
