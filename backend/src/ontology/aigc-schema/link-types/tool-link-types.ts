/**
 * AIGC LinkType Definitions (Refactored)
 *
 * 语义层 - LinkType 定义
 * 对齐 Palantir Foundry Ontology 标准
 *
 */

import type { LinkTypeV2 } from '../../types';

/**
 * LinkType: toolProvidedBy
 * 工具 → 提供商 (MANY_TO_ONE via Foreign Key)
 */
export const toolProvidedByLinkType: LinkTypeV2 = {
  id: 'link-type-tool-provided-by',
  apiName: 'toolProvidedBy',
  displayName: '由...提供',
  description: 'AI工具的开发商/提供商',
  status: 'ACTIVE',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.link-type.tool-provided-by',
  cardinality: 'MANY_TO_ONE',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'ToolProvider',
  sourceDisplayName: '提供商',
  targetDisplayName: '提供的工具',
  sourceLinkApiName: 'providedTools',
  targetLinkApiName: 'provider',
  foreignKeyPropertyApiName: 'developer',
  primaryKeyPropertyApiName: 'name',
};

/**
 * LinkType: toolBelongsToCategory
 * 工具 → 分类 (MANY_TO_ONE via Foreign Key)
 */
export const toolBelongsToCategoryLinkType: LinkTypeV2 = {
  id: 'link-type-tool-belongs-to-category',
  apiName: 'toolBelongsToCategory',
  displayName: '属于分类',
  description: 'AI工具所属的功能分类',
  status: 'ACTIVE',
  visibility: 'PROMINENT',
  rid: 'ri.aigc.main.link-type.tool-belongs-to-category',
  cardinality: 'MANY_TO_ONE',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'ToolCategory',
  sourceDisplayName: '分类',
  targetDisplayName: '包含的工具',
  sourceLinkApiName: 'category',
  targetLinkApiName: 'tools',
  foreignKeyPropertyApiName: 'categorySlug',
  primaryKeyPropertyApiName: 'slug',
};

/**
 * LinkType: toolHasPricingPlan
 * 工具 → 定价方案 (ONE_TO_MANY via Foreign Key on PricingPlan)
 */
export const toolHasPricingPlanLinkType: LinkTypeV2 = {
  id: 'link-type-tool-has-pricing-plan',
  apiName: 'toolHasPricingPlan',
  displayName: '拥有定价',
  description: 'AI工具的多个定价方案',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.link-type.tool-has-pricing-plan',
  cardinality: 'ONE_TO_MANY',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'PricingPlan',
  sourceDisplayName: '定价方案',
  targetDisplayName: '所属工具',
  sourceLinkApiName: 'pricingPlans',
  targetLinkApiName: 'tool',
  foreignKeyPropertyApiName: 'toolSlug',
  primaryKeyPropertyApiName: 'slug',
};

/**
 * LinkType: toolHasCapability
 * 工具 → 能力矩阵 (ONE_TO_ONE via Foreign Key on ToolCapability)
 */
export const toolHasCapabilityLinkType: LinkTypeV2 = {
  id: 'link-type-tool-has-capability',
  apiName: 'toolHasCapability',
  displayName: '拥有能力',
  description: 'AI工具的能力矩阵',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.link-type.tool-has-capability',
  cardinality: 'ONE_TO_ONE',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'ToolCapability',
  sourceDisplayName: '能力',
  targetDisplayName: '所属工具',
  sourceLinkApiName: 'capability',
  targetLinkApiName: 'tool',
  foreignKeyPropertyApiName: 'toolSlug',
  primaryKeyPropertyApiName: 'slug',
};

/**
 * LinkType: toolSuitableFor
 * 工具 → 使用场景 (MANY_TO_MANY via Join Table)
 */
export const toolSuitableForLinkType: LinkTypeV2 = {
  id: 'link-type-tool-suitable-for',
  apiName: 'toolSuitableFor',
  displayName: '适用于',
  description: 'AI工具适合的使用场景',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.link-type.tool-suitable-for',
  cardinality: 'MANY_TO_MANY',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'UseCase',
  sourceDisplayName: '适用场景',
  targetDisplayName: '适合的工具',
  sourceLinkApiName: 'useCases',
  targetLinkApiName: 'suitableTools',
};

/**
 * LinkType: toolCompetitorOf
 * 工具 → 竞品 (MANY_TO_MANY via Join Table)
 */
export const toolCompetitorOfLinkType: LinkTypeV2 = {
  id: 'link-type-tool-competitor-of',
  apiName: 'toolCompetitorOf',
  displayName: '竞品关系',
  description: 'AI工具之间的竞争关系',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.link-type.tool-competitor-of',
  cardinality: 'MANY_TO_MANY',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'AIGCTool',
  sourceDisplayName: '竞品',
  targetDisplayName: '竞品',
  sourceLinkApiName: 'competitors',
  targetLinkApiName: 'competitors',
};

/**
 * LinkType: toolHasReview
 * 工具 → 用户评价 (ONE_TO_MANY via Foreign Key on UserReview)
 */
export const toolHasReviewLinkType: LinkTypeV2 = {
  id: 'link-type-tool-has-review',
  apiName: 'toolHasReview',
  displayName: '用户评价',
  description: '用户对工具的评价',
  status: 'ACTIVE',
  visibility: 'NORMAL',
  rid: 'ri.aigc.main.link-type.tool-has-review',
  cardinality: 'ONE_TO_MANY',
  sourceObjectTypeApiName: 'AIGCTool',
  targetObjectTypeApiName: 'UserReview',
  sourceDisplayName: '用户评价',
  targetDisplayName: '评价的工具',
  sourceLinkApiName: 'reviews',
  targetLinkApiName: 'tool',
  foreignKeyPropertyApiName: 'toolSlug',
  primaryKeyPropertyApiName: 'slug',
};

/**
 * Export all LinkTypes
 */
export const aigcLinkTypes: LinkTypeV2[] = [
  toolProvidedByLinkType,
  toolBelongsToCategoryLinkType,
  toolHasPricingPlanLinkType,
  toolHasCapabilityLinkType,
  toolSuitableForLinkType,
  toolCompetitorOfLinkType,
  toolHasReviewLinkType,
];
