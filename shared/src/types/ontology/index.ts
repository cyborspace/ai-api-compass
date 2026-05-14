// ============================================================
// Palantir Ontology Types - 共享类型定义
// ============================================================

// 语义层类型
export interface ObjectType {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'deprecated';
  icon?: string;
  color?: string;
  primaryKeys: string[];
  titleKeys: string[];
  properties: PropertyDefinition[];
  backingDatasources?: string[];
  typeClasses?: string[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PropertyDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  baseType: BaseType;
  valueType?: ValueType;
  isPrimaryKey?: boolean;
  isTitleKey?: boolean;
  isRequired?: boolean;
  isReadOnly?: boolean;
  defaultValue?: unknown;
  enumValues?: string[];
  constraints?: PropertyConstraints;
  renderHints?: RenderHints[];
}

export type BaseType =
  | 'String'
  | 'Integer'
  | 'Float'
  | 'Boolean'
  | 'Date'
  | 'Timestamp'
  | 'Decimal'
  | 'Array'
  | 'Object';

export type ValueType =
  | 'Email'
  | 'Url'
  | 'Phone'
  | 'Uuid'
  | 'Json'
  | 'Html';

export interface PropertyConstraints {
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
}

export type RenderHints =
  | 'Searchable'
  | 'Selectable'
  | 'Sortable'
  | 'LowCardinality'
  | 'Identifier'
  | 'Keywords'
  | 'LongText'
  | 'DisableFormatting';

// Object 实例
export interface Object {
  id: string;
  objectTypeId: string;
  rid?: string;
  properties: Record<string, unknown>;
  status: 'active' | 'inactive' | 'deprecated';
  dataSourceId?: string;
  externalId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// LinkType
export interface LinkType {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'deprecated';
  sourceObjectTypeId: string;
  targetObjectTypeId: string;
  cardinality: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  visibility: 'prominent' | 'hidden';
  foreignKeyProperty?: string;
  propertyDefinitions?: PropertyDefinition[];
  backingDatasources?: string[];
  typeClasses?: string[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

// Link 实例
export interface Link {
  id: string;
  linkTypeId: string;
  sourceObjectId: string;
  targetObjectId: string;
  properties: Record<string, unknown>;
  dataSourceId?: string;
  externalId?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// 动力层类型
// ============================================================

// ActionType
export interface ActionType {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'deprecated';
  applicableObjectTypes: string[];
  parameters: ParameterDefinition[];
  rules: Rule[];
  submissionCriteria: SubmissionCriterion[];
  sideEffects: SideEffect[];
  permissions: Record<string, unknown>;
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParameterDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  constraints?: PropertyConstraints;
}

export interface Rule {
  type: 'CreateObject' | 'ModifyObject' | 'DeleteObject' | 'CreateLink' | 'DeleteLink' | 'FunctionRule';
  order?: number;
  objectType?: string;
  primaryKey?: string;
  function?: string;
}

export interface SubmissionCriterion {
  condition: string;
  operator: 'is' | 'isNot' | 'contains' | 'greaterThan' | 'lessThan';
  value: unknown;
  failureMessage: string;
}

export interface SideEffect {
  type: 'Notification' | 'Webhook';
  webhookConfig?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
  };
}

// Action 实例
export interface Action {
  id: string;
  actionTypeId: string;
  objectId?: string;
  parameters: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  result?: Record<string, unknown>;
  error?: string;
  errorDetails?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  submittedAt?: string;
  startedAt?: string;
  completedAt?: string;
  submittedBy?: string;
  executedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Function
export interface Function {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  functionType: 'QUERY' | 'ONTOLOGY_EDIT';
  editsObjectTypes?: string[];
  inputParameters: Record<string, ParameterDefinition>;
  outputDefinition: Record<string, unknown>;
  implementationType: 'TYPESCRIPT' | 'PYTHON';
  implementation: Record<string, unknown>;
  permissions: Record<string, unknown>;
  timeout: number;
  status: 'active' | 'inactive' | 'deprecated';
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// 接口层类型
// ============================================================

export interface Interface {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: 'active' | 'experimental' | 'deprecated';
  icon?: string;
  color?: string;
  sharedProperties: SharedPropertyDefinition[];
  interfaceLinkTypes: InterfaceLinkType[];
  extendedInterfaces: string[];
  version: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharedPropertyDefinition {
  key: string;
  label: string;
  type: string;
  description?: string;
}

export interface InterfaceLinkType {
  apiName: string;
  targetInterface: string;
  description?: string;
}

export interface InterfaceImplementation {
  id: string;
  interfaceId: string;
  objectTypeId: string;
  createdAt: string;
}
