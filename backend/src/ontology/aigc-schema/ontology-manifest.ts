/**
 * AIGC Ontology Manifest
 * 
 * AIGC工具导航平台的完整Ontology定义
 * 
 * 遵循 Palantir Foundry Ontology 三层架构:
 * 1. 语义层 (Semantic Layer): ObjectType, LinkType, Property, ValueType
 * 2. 动力层 (Kinetic Layer): ActionType, Function
 * 3. 接口层 (Interface Layer): Interface
 */

// =============================================================================
// Import all definitions
// =============================================================================

// ObjectTypes
import { AIGCToolObjectType } from './object-types/aigc-tool.object-type';
import { ToolCategoryObjectType } from './object-types/tool-category.object-type';
import { ToolProviderObjectType } from './object-types/tool-provider.object-type';
import { ToolTagObjectType } from './object-types/tool-tag.object-type';
import { UseCaseObjectType } from './object-types/use-case.object-type';
import { PricingPlanObjectType } from './object-types/pricing-plan.object-type';
import { ToolCapabilityObjectType } from './object-types/tool-capability.object-type';
import { TechnicalSpecObjectType } from './object-types/technical-spec.object-type';
import { UserReviewObjectType } from './object-types/user-review.object-type';
import { TrendMetricObjectType } from './object-types/trend-metric.object-type';
import { CompetitorAnalysisObjectType } from './object-types/competitor-analysis.object-type';

// LinkTypes
import { aigcLinkTypes } from './link-types/tool-link-types';

// ValueTypes
import { aigcValueTypes } from './value-types/aigc-value-types';

// ActionTypes
import { aigcActionTypes } from './action-types/aigc-action-types';

// Functions
import { aigcFunctions } from './functions/aigc-functions';
import { rankingFunctions } from './functions/ranking-functions';
import { heatFunctions } from './functions/heat-functions';
import { scoringFunctions } from './functions/scoring-functions';
import { recommendationFunctions } from './functions/recommendation-functions';
import { antiGamingFunctions } from './functions/anti-gaming-functions';
import { scenarioFunctions } from './functions/scenario-functions';

// Interfaces
import { aigcInterfaces } from './interfaces/aigc-interfaces';

// Types
import type { ObjectTypeV2, LinkTypeV2, OntologyValueType, ActionTypeV2, FunctionV2, InterfaceType } from '../types';

// =============================================================================
// Ontology Manifest
// =============================================================================

export interface AIGCOntologyManifest {
  /** Ontology identifier */
  rid: string;
  
  /** Ontology name */
  name: string;
  
  /** Ontology description */
  description: string;
  
  /** Version */
  version: string;
  
  /** Last updated */
  updatedAt: string;
  
  // Semantic Layer
  /** ObjectType definitions */
  objectTypes: ObjectTypeV2[];
  
  /** LinkType definitions */
  linkTypes: LinkTypeV2[];
  
  /** ValueType definitions */
  valueTypes: OntologyValueType[];
  
  // Kinetic Layer
  /** ActionType definitions */
  actionTypes: ActionTypeV2[];
  
  /** Function definitions */
  functions: FunctionV2[];
  
  // Interface Layer
  /** Interface definitions */
  interfaces: InterfaceType[];
  
  // Metadata
  /** Groups for organizing ObjectTypes */
  objectTypeGroups: ObjectTypeGroup[];
  
  /** Statistics */
  stats: OntologyStats;
}

export interface ObjectTypeGroup {
  apiName: string;
  displayName: string;
  description?: string;
}

export interface OntologyStats {
  totalObjectTypes: number;
  totalLinkTypes: number;
  totalValueTypes: number;
  totalActionTypes: number;
  totalFunctions: number;
  totalInterfaces: number;
}

// =============================================================================
// Create Manifest
// =============================================================================

export const aigcOntologyManifest: AIGCOntologyManifest = {
  rid: 'ri.aigc.main.ontology',
  name: 'AIGC工具导航',
  description: 'AIGC工具导航平台的Ontology，支持多维度对比和智能推荐',
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  
  // Semantic Layer
  objectTypes: [
    AIGCToolObjectType,
    ToolCategoryObjectType,
    ToolProviderObjectType,
    ToolTagObjectType,
    UseCaseObjectType,
    PricingPlanObjectType,
    ToolCapabilityObjectType,
    TechnicalSpecObjectType,
    UserReviewObjectType,
    TrendMetricObjectType,
    CompetitorAnalysisObjectType
  ],
  
  linkTypes: aigcLinkTypes,
  
  valueTypes: aigcValueTypes,
  
  // Kinetic Layer
  actionTypes: aigcActionTypes,
  
  functions: [
    ...aigcFunctions,
    ...rankingFunctions,
    ...heatFunctions,
    ...scoringFunctions,
    ...recommendationFunctions,
    ...antiGamingFunctions,
    ...scenarioFunctions,
  ],
  
  // Interface Layer
  interfaces: aigcInterfaces,
  
  // Metadata
  objectTypeGroups: [
    { apiName: 'AIGCProduct', displayName: 'AIGC产品', description: '核心产品实体' },
    { apiName: 'Comparison', displayName: '对比分析', description: '支持对比功能的实体' },
    { apiName: 'Intelligence', displayName: '智能系统', description: '推荐和排名系统' },
    { apiName: 'Analytics', displayName: '分析系统', description: '热度计算和防作弊系统' }
  ],
  
  stats: {
    totalObjectTypes: 11,
    totalLinkTypes: 7,
    totalValueTypes: 13,
    totalActionTypes: 4,
    totalFunctions: 5 + 8 + 8 + 7 + 7 + 6 + 5, // aigc + ranking + heat + scoring + recommendation + antiGaming + scenario
    totalInterfaces: 4
  }
};

// =============================================================================
// Exports
// =============================================================================

export default aigcOntologyManifest;

// Re-export individual components for granular imports
export * from './object-types/aigc-tool.object-type';
export * from './object-types/tool-category.object-type';
export * from './object-types/tool-provider.object-type';
export * from './object-types/tool-tag.object-type';
export * from './object-types/use-case.object-type';
export * from './object-types/pricing-plan.object-type';
export * from './object-types/tool-capability.object-type';
export * from './object-types/technical-spec.object-type';
export * from './object-types/user-review.object-type';
export * from './object-types/trend-metric.object-type';
export * from './object-types/competitor-analysis.object-type';

export * from './link-types/tool-link-types';
export * from './value-types/aigc-value-types';
export * from './action-types/aigc-action-types';
export * from './functions/aigc-functions';
export * from './functions/ranking-functions';
export * from './functions/heat-functions';
export * from './functions/scoring-functions';
export * from './functions/recommendation-functions';
export * from './functions/anti-gaming-functions';
export * from './functions/scenario-functions';
export * from './interfaces/aigc-interfaces';
