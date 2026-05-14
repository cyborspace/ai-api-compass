// Property base types for ontology system

export const PROPERTY_BASE_TYPES = [
  "TEXT",
  "INTEGER",
  "FLOAT",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "BLOB",
  "JSON",
  "LONG",
  "DOUBLE",
  "DECIMAL",
  "RICH_TEXT",
  "EMAIL",
  "PHONE",
  "URL",
  "COLOR",
  "MONEY",
  "PERCENTAGE",
  "FILE",
  "IMAGE",
  "GEOMETRY",
  "POINT",
] as const;

export type PropertyBaseType = (typeof PROPERTY_BASE_TYPES)[number];

export const PROPERTY_BASE_TYPE_LABELS: Record<PropertyBaseType, string> = {
  TEXT: "Text",
  INTEGER: "Integer",
  FLOAT: "Float",
  BOOLEAN: "Boolean",
  DATE: "Date",
  DATETIME: "DateTime",
  TIMESTAMP: "Timestamp",
  BLOB: "Blob",
  JSON: "JSON",
  LONG: "Long",
  DOUBLE: "Double",
  DECIMAL: "Decimal",
  RICH_TEXT: "Rich Text",
  EMAIL: "Email",
  PHONE: "Phone",
  URL: "URL",
  COLOR: "Color",
  MONEY: "Money",
  PERCENTAGE: "Percentage",
  FILE: "File",
  IMAGE: "Image",
  GEOMETRY: "Geometry",
  POINT: "Point",
};

// Relation kinds for link types
export interface RelationKindDef {
  value: string;
  label: string;
  stage: number;
  cardinality?: "ONE_TO_ONE" | "ONE_TO_MANY";
}

export const RELATION_KINDS: RelationKindDef[] = [
  // Stage 1 - Core Relations
  { value: "belongsTo", label: "Belongs To", stage: 1, cardinality: "ONE_TO_ONE" },
  { value: "hasMany", label: "Has Many", stage: 1, cardinality: "ONE_TO_MANY" },
  { value: "hasOne", label: "Has One", stage: 1, cardinality: "ONE_TO_ONE" },

  // Stage 2 - Composition
  { value: "composedOf", label: "Composed Of", stage: 2, cardinality: "ONE_TO_MANY" },
  { value: "partOf", label: "Part Of", stage: 2, cardinality: "ONE_TO_ONE" },
  { value: "contains", label: "Contains", stage: 2, cardinality: "ONE_TO_MANY" },
  { value: "containedIn", label: "Contained In", stage: 2, cardinality: "ONE_TO_ONE" },

  // Stage 3 - Association
  { value: "associatedWith", label: "Associated With", stage: 3, cardinality: "ONE_TO_MANY" },
  { value: "relatedTo", label: "Related To", stage: 3, cardinality: "ONE_TO_MANY" },
  { value: "references", label: "References", stage: 3, cardinality: "ONE_TO_ONE" },
  { value: "referencedBy", label: "Referenced By", stage: 3, cardinality: "ONE_TO_MANY" },

  // Stage 4 - Dependency
  { value: "dependsOn", label: "Depends On", stage: 4, cardinality: "ONE_TO_ONE" },
  { value: "requiredBy", label: "Required By", stage: 4, cardinality: "ONE_TO_MANY" },
  { value: "supports", label: "Supports", stage: 4, cardinality: "ONE_TO_MANY" },
  { value: "supportedBy", label: "Supported By", stage: 4, cardinality: "ONE_TO_MANY" },

  // Stage 4.5 - Classification
  { value: "classifiedBy", label: "Classified By", stage: 4.5, cardinality: "ONE_TO_ONE" },
  { value: "classifies", label: "Classifies", stage: 4.5, cardinality: "ONE_TO_MANY" },
  { value: "categorizedBy", label: "Categorized By", stage: 4.5, cardinality: "ONE_TO_ONE" },

  // Stage 5 - Hierarchy
  { value: "parentOf", label: "Parent Of", stage: 5, cardinality: "ONE_TO_MANY" },
  { value: "childOf", label: "Child Of", stage: 5, cardinality: "ONE_TO_ONE" },
  { value: "ancestorOf", label: "Ancestor Of", stage: 5, cardinality: "ONE_TO_MANY" },
  { value: "descendantOf", label: "Descendant Of", stage: 5, cardinality: "ONE_TO_ONE" },

  // Stage 6 - Temporal
  { value: "precedes", label: "Precedes", stage: 6, cardinality: "ONE_TO_ONE" },
  { value: "follows", label: "Follows", stage: 6, cardinality: "ONE_TO_ONE" },
  { value: "succeeds", label: "Succeeds", stage: 6, cardinality: "ONE_TO_ONE" },

  // Stage 7 - Specialized
  { value: "implements", label: "Implements", stage: 7, cardinality: "ONE_TO_ONE" },
  { value: "implementedBy", label: "Implemented By", stage: 7, cardinality: "ONE_TO_MANY" },
  { value: "extends", label: "Extends", stage: 7, cardinality: "ONE_TO_ONE" },
  { value: "extendedBy", label: "Extended By", stage: 7, cardinality: "ONE_TO_MANY" },
  { value: "overrides", label: "Overrides", stage: 7, cardinality: "ONE_TO_ONE" },
  { value: "overriddenBy", label: "Overridden By", stage: 7, cardinality: "ONE_TO_MANY" },
];

export function getRelationKindLabel(value: string): string {
  const def = RELATION_KINDS.find((rk) => rk.value === value);
  return def ? def.label : value;
}

// Value Type constraint type
export interface ValueTypeConstraint {
  type?: string;
  [key: string]: any;
}

// Common value type field types
export const COMMON_VALUE_TYPE_FIELD_TYPES = [
  "TEXT",
  "INTEGER",
  "FLOAT",
  "BOOLEAN",
  "DATE",
  "DATETIME",
  "TIMESTAMP",
  "JSON",
  "LONG",
  "DOUBLE",
] as const;

// Type badge CSS classes for styling
export const TYPE_BADGE_CLASS: Record<string, string> = {
  TEXT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  INTEGER: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FLOAT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  DOUBLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  BOOLEAN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DATE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  DATETIME: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  TIMESTAMP: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  JSON: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  BLOB: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  LONG: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  DECIMAL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
  RICH_TEXT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  EMAIL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PHONE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  URL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COLOR: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  MONEY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  PERCENTAGE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  FILE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  IMAGE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  GEOMETRY: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  POINT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};
