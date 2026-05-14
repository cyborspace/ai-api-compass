/**
 * AIGC Ontology Schema
 *
 * AIGC工具导航平台的完整Ontology定义
 *
 * 使用方法:
 *
 * ```typescript
 * import { aigcOntologyManifest } from './ontology/aigc-schema';
 *
 * // 获取所有ObjectTypes
 * const objectTypes = aigcOntologyManifest.objectTypes;
 *
 * // 获取特定ObjectType
 * import { AIGCToolObjectType } from './ontology/aigc-schema';
 *
 * // 获取所有LinkTypes
 * import { aigcLinkTypes } from './ontology/aigc-schema';
 * ```
 */

// Re-export from aigc-schema
export * from './aigc-schema';
