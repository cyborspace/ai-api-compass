/**
 * Core Types for Ontology
 *
 * Palantir Ontology 核心类型定义
 */

// =============================================================================
// Base Types
// =============================================================================

export type BaseType =
  | 'string'
  | 'integer'
  | 'long'
  | 'float'
  | 'double'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'array'
  | 'object';

export type ReleaseStatus = 'ACTIVE' | 'EXPERIMENTAL' | 'DEPRECATED' | 'EXAMPLE';
export type Visibility = 'PROMINENT' | 'HIDDEN' | 'NORMAL';

export type Rid = string;
export type ApiName = string;
export type TypeClass = string;

export interface Icon {
  blueprint?: {
    color?: string;
    name?: string;
  };
}

export interface ObjectPropertyType {
  type: string;
  [key: string]: any;
}

// =============================================================================
// Property Types
// =============================================================================

export interface PropertyV2 {
  apiName?: string;
  displayName: string;
  description?: string;
  dataType: { type: string; [key: string]: any };
  rid?: string;
  typeClasses?: string[];
  required?: boolean;
  isUnique?: boolean;
  isAdvancedSearchable?: boolean;
  valueType?: string;
  valueTypeApiName?: string;
  renderHints?: {
    searchable?: boolean;
    sortable?: boolean;
    visibleInDefaultView?: boolean;
    displayedAsColumn?: boolean;
    [key: string]: any;
  };
  group?: string;
  defaultValue?: any;
}

export interface PropertyDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  baseType: BaseType;
  valueType?: string;
  required?: boolean;
  defaultValue?: any;
  nullable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
}

// =============================================================================
// Backing Datasource
// =============================================================================

export type DatasourceType = 'PRISMA_MODEL' | 'POSTGRES_TABLE' | 'REST_API' | 'GRAPHQL' | 'CUSTOM';

export interface BackingDatasource {
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  datasourceType: DatasourceType;
  /** Prisma model name, table name, or API endpoint */
  sourceIdentifier: string;
  /** Schema/database name if applicable */
  schemaName?: string;
  /** Whether this datasource is the primary/authoritative source */
  isPrimary: boolean;
  /** Property mapping: Ontology property apiName -> datasource column/field name */
  propertyMappings?: Record<string, string>;
  /** Whether the datasource supports writes */
  supportsWrites?: boolean;
  /** Sync configuration */
  syncConfig?: {
    mode?: 'REAL_TIME' | 'SCHEDULED' | 'MANUAL';
    schedule?: string;
    lastSyncAt?: string;
  };
  status?: ReleaseStatus;
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// Object Type
// =============================================================================

export interface ObjectTypeV2 {
  apiName?: string;
  displayName?: string;
  pluralDisplayName?: string;
  description?: string;
  status?: ReleaseStatus;
  icon?: Icon;
  primaryKey?: string;
  titleProperty?: string;
  visibility?: Visibility;
  rid?: string;
  metaKind?: string;
  entityLevel?: string;
  groups?: Array<{ apiName: string; displayName: string }>;
  aliases?: string[];
  properties?: { [key: string]: any };
  /** Backing Datasources: Ontology Object Type to physical datasource mapping */
  backingDatasources?: BackingDatasource[];
  [key: string]: any;
}

export interface ObjectTypeGroup {
  apiName: string;
  displayName: string;
  description?: string;
}

// =============================================================================
// Link Type
// =============================================================================

export type LinkCardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export interface LinkTypeV2 {
  id?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status?: ReleaseStatus;
  visibility?: Visibility;
  rid?: string;
  /** Cardinality of the link */
  cardinality?: LinkCardinality;
  /** Source object type API name */
  sourceObjectTypeApiName?: string;
  /** Target object type API name */
  targetObjectTypeApiName?: string;
  /** Display name from source side */
  sourceDisplayName?: string;
  /** Display name from target side */
  targetDisplayName?: string;
  /** Link API name from source side */
  sourceLinkApiName?: string;
  /** Link API name from target side */
  targetLinkApiName?: string;
  /** Foreign key property name (for ONE_TO_MANY, MANY_TO_ONE, ONE_TO_ONE) */
  foreignKeyPropertyApiName?: string;
  /** Primary key property name in target object type */
  primaryKeyPropertyApiName?: string;
  /** Backing datasources for this link type */
  backingDatasources?: BackingDatasource[];
  [key: string]: any;
}

// =============================================================================
// Value Type
// =============================================================================

export interface OntologyValueType {
  apiName: string;
  displayName: string;
  description?: string;
  baseType?: BaseType;
  fieldType?: { type: string; innerType?: { type: string }; [key: string]: any };
  constraints?: any[];
  status?: ReleaseStatus;
  rid?: string;
  version?: string;
  [key: string]: any;
}

// =============================================================================
// Action Type
// =============================================================================

export interface ParameterDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  dataType: { type: string; [key: string]: any };
  required?: boolean;
  defaultValue?: any;
  hidden?: boolean;
  readOnly?: boolean;
  exposedInForm?: boolean;
}

export interface Rule {
  type: string;
  [key: string]: any;
}

export interface SubmissionCriterion {
  type: string;
  parameter?: string;
  condition?: any;
  errorMessage?: string;
  [key: string]: any;
}

export interface SideEffect {
  type: string;
  [key: string]: any;
}

export interface PermissionConfig {
  [key: string]: any;
}

export interface ActionTypeV2 {
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: ReleaseStatus;
  applicableObjectTypes?: string[];
  parameters?: ParameterDefinition[];
  rules?: Rule[];
  submissionCriteria?: SubmissionCriterion[];
  sideEffects?: SideEffect[];
  permissions?: PermissionConfig;
  version?: number;
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

// =============================================================================
// Function Type
// =============================================================================

export interface FunctionV2 {
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: ReleaseStatus;
  parameters?: ParameterDefinition[];
  returnType?: { dataType: { type: string; [key: string]: any }; [key: string]: any };
  decorator?: string;
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

export interface FunctionExecutionResult {
  success: boolean;
  returnValue?: any;
  error?: string;
  executionTimeMs?: number;
  objectsLoaded?: number;
}

// =============================================================================
// Interface Type
// =============================================================================

export interface InterfaceType {
  apiName: string;
  displayName?: string;
  description?: string;
  rid?: string;
  status?: ReleaseStatus;
  properties?: { [key: string]: any };
  implementedByObjectTypes?: string[];
  [key: string]: any;
}

// =============================================================================
// Ontology Manifest
// =============================================================================

export interface OntologyManifest {
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  version: string;
  objectTypes?: ObjectTypeV2[];
  linkTypes?: LinkTypeV2[];
  actionTypes?: ActionTypeV2[];
  functions?: FunctionV2[];
  valueTypes?: OntologyValueType[];
  interfaces?: InterfaceType[];
  [key: string]: any;
}
