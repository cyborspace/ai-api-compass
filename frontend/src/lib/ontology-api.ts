/**
 * Ontology API Client - Palantir Ontology Explorer
 * 对应后端 /api/ontologies/* 端点
 */

import { request } from "./api";

// =============================================================================
// Types
// =============================================================================

export interface Ontology {
  rid: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
  objectTypesCount: number;
  linkTypesCount: number;
  actionTypesCount: number;
  functionsCount: number;
  valueTypesCount: number;
  interfacesCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ObjectType {
  id: string;
  rid: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
  icon?: string;
  color?: string;
  properties: PropertyDefinition[];
  primaryKeys: string[];
  titleKeys: string[];
  version: number;
  createdAt: string;
  updatedAt: string;
  objectsCount?: number;
}

export interface PropertyDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  baseType: string;
  valueType?: string;
  isRequired?: boolean;
  constraints?: Record<string, unknown>;
}

export interface LinkType {
  id: string;
  rid?: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
  sourceObjectTypeId: string;
  targetObjectTypeId: string;
  cardinality: string;
  propertyDefinitions: PropertyDefinition[];
}

export interface ValueType {
  id: string;
  apiName: string;
  displayName: string;
  fieldType: string;
  constraints?: Record<string, unknown>;
}

export interface InterfaceType {
  id: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
}

export interface ActionType {
  id: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
}

export interface FunctionType {
  id: string;
  apiName: string;
  displayName: string;
  description?: string;
  status: string;
}

export interface OntologyObject {
  id: string;
  rid: string;
  objectTypeId: string;
  properties: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OntologyGroup {
  apiName: string;
  displayName: string;
  objectTypes: string[];
  objectTypeCount: number;
}

// =============================================================================
// API Functions
// =============================================================================

export async function fetchOntologies(): Promise<{ data: Ontology[] }> {
  return request("/api/ontologies");
}

export async function fetchOntology(ontologyRid: string): Promise<{ data: Ontology }> {
  return request(`/api/ontologies/${ontologyRid}`);
}

export async function fetchObjectTypes(ontologyRid: string): Promise<{ data: ObjectType[] }> {
  return request(`/api/ontologies/${ontologyRid}/objectTypes`);
}

export async function fetchObjectType(ontologyRid: string, apiName: string): Promise<{ data: ObjectType }> {
  return request(`/api/ontologies/${ontologyRid}/objectTypes/${apiName}`);
}

export async function fetchObjectTypeObjects(
  ontologyRid: string,
  apiName: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: OntologyObject[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.offset) params.set("offset", String(options.offset));
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/ontologies/${ontologyRid}/objectTypes/${apiName}/objects${query}`);
}

export async function fetchLinkTypes(ontologyRid: string): Promise<{ data: LinkType[] }> {
  return request(`/api/ontologies/${ontologyRid}/linkTypes`);
}

export async function fetchValueTypes(ontologyRid: string): Promise<{ data: ValueType[] }> {
  return request(`/api/ontologies/${ontologyRid}/valueTypes`);
}

export async function fetchInterfaces(ontologyRid: string): Promise<{ data: InterfaceType[] }> {
  return request(`/api/ontologies/${ontologyRid}/interfaces`);
}

export async function fetchActionTypes(ontologyRid: string): Promise<{ data: ActionType[] }> {
  return request(`/api/ontologies/${ontologyRid}/actionTypes`);
}

export async function fetchFunctions(ontologyRid: string): Promise<{ data: FunctionType[] }> {
  return request(`/api/ontologies/${ontologyRid}/functions`);
}

export async function fetchGroups(ontologyRid: string): Promise<{ data: OntologyGroup[] }> {
  return request(`/api/ontologies/${ontologyRid}/groups`);
}
