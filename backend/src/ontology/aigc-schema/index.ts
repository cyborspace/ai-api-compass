/**
 * AIGC工具导航 - Ontology Schema
 * 
 * 遵循 Palantir Foundry Ontology 三层架构:
 * 1. 语义层 (Semantic Layer): ObjectType, LinkType, Property, ValueType
 * 2. 动力层 (Kinetic Layer): ActionType, Function
 * 3. 接口层 (Interface Layer): Interface
 * 
 * 核心参考: docs/packages/core/src/types/
 */

// Semantic Layer
export * from './object-types/aigc-tool.object-type';
export * from './object-types/tool-provider.object-type';
export * from './object-types/tool-category.object-type';
export * from './object-types/tool-tag.object-type';
export * from './object-types/use-case.object-type';
export * from './object-types/pricing-plan.object-type';
export * from './object-types/tool-capability.object-type';
export * from './object-types/technical-spec.object-type';
export * from './object-types/user-review.object-type';
export * from './object-types/trend-metric.object-type';
export * from './object-types/competitor-analysis.object-type';

// Link Types
export * from './link-types/tool-link-types';

// Value Types
export * from './value-types/aigc-value-types';

// Kinetic Layer
export * from './action-types/aigc-action-types';
export * from './functions/aigc-functions';
export * from './functions/ranking-functions';
export * from './functions/heat-functions';
export * from './functions/scoring-functions';
export * from './functions/recommendation-functions';
export * from './functions/anti-gaming-functions';
export * from './functions/scenario-functions';

// Interface Layer
export * from './interfaces/aigc-interfaces';

// Ontology Manifest
export * from './ontology-manifest';
