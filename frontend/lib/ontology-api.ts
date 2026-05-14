const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface LinkTypeUpdate {
  displayName?: string;
  description?: string;
  visibility?: string;
  status?: string;
  relationKind?: string;
  cardinality?: string;
  relationLevel?: string;
  aSideDisplayName?: string;
  bSideDisplayName?: string;
  aSideLinkApiName?: string;
  bSideLinkApiName?: string;
  foreignKeyPropertyApiName?: string;
  primaryKeyPropertyApiName?: string;
  joinTableDatasetRid?: string;
  joinTableAColumn?: string;
  joinTableBColumn?: string;
  backingObjectApiName?: string;
  aSideToBackingLinkApiName?: string;
  bSideToBackingLinkApiName?: string;
}

export interface ActionTypeUpdate {
  displayName?: string;
  description?: string;
  visibility?: string;
  status?: string;
  returnType?: string;
}

class OntologyApiClient {
  getAuthHeaders(): Record<string, string> {
    // Use compat mode headers for development
    // In production, this should use JWT tokens from auth context
    return {
      'x-user-id': 'dev-user',
      'x-user-roles': JSON.stringify(['admin']),
    };
  }

  async request<T>(path: string, options?: RequestInit): Promise<T> {
    // Merge headers properly to ensure auth headers are always included
    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options?.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: mergedHeaders,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const apiError = data as ApiError | null;
      throw new Error(apiError?.error?.message || `HTTP ${res.status}`);
    }
    return data as T;
  }

  async deleteRequest(path: string): Promise<void> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      const apiError = data as ApiError | null;
      throw new Error(apiError?.error?.message || `HTTP ${res.status}`);
    }
  }

  // ============ Health ============
  getHealth() {
    return this.request<{ status: string; version: string }>('/api/health');
  }

  // ============ Ontologies ============
  getOntologies() {
    return this.request<{ data: any[] }>('/api/ontologies');
  }

  getOntology(ontologyRid: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}`);
  }

  createOntology(input: { apiName: string; displayName: string; description?: string }) {
    return this.request<{ data: any }>('/api/ontologies', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateOntology(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  deleteOntology(ontologyRid: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}`);
  }

  // ============ Object Types ============
  getObjectTypes(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/objectTypes`);
  }

  getObjectType(ontologyRid: string, apiName: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/objectTypes/${apiName}`);
  }

  createObjectType(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/objectTypes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateObjectType(ontologyRid: string, apiName: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/objectTypes/${apiName}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  deleteObjectType(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/objectTypes/${apiName}`);
  }

  // ============ Properties ============
  addProperty(ontologyRid: string, objectTypeApiName: string, input: any) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/properties`,
      { method: 'POST', body: JSON.stringify(input) },
    );
  }

  /**
   * Batch add Properties
   * @param ontologyRid - Ontology RID
   * @param objectTypeApiName - ObjectType API name
   * @param inputs - Property data array
   * @returns Batch operation result
   */
  async addPropertiesBatch(
    ontologyRid: string,
    objectTypeApiName: string,
    inputs: any[],
  ): Promise<{ data: any[]; errors: { index: number; error: string }[] }> {
    const results: any[] = [];
    const errors: { index: number; error: string }[] = [];

    // Execute sequentially to avoid concurrency issues
    for (let i = 0; i < inputs.length; i++) {
      try {
        const result = await this.addProperty(ontologyRid, objectTypeApiName, inputs[i]);
        results.push(result.data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ index: i, error: errorMessage });
        // Continue processing the next one, don't interrupt batch operation
      }
    }

    return { data: results, errors };
  }

  removeProperty(ontologyRid: string, objectTypeApiName: string, propertyApiName: string) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/properties/${propertyApiName}`,
      { method: 'DELETE' },
    );
  }

  // ============ Value Types ============
  getValueTypes(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/valueTypes`);
  }

  getValueType(ontologyRid: string, apiName: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/valueTypes/${apiName}`);
  }

  createValueType(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/valueTypes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateValueType(ontologyRid: string, apiName: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/valueTypes/${apiName}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  deleteValueType(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/valueTypes/${apiName}`);
  }

  // ============ Interfaces ============
  getInterfaces(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/interfaces`);
  }

  getInterface(ontologyRid: string, apiName: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/interfaces/${apiName}`);
  }

  createInterface(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/interfaces`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  updateInterface(ontologyRid: string, apiName: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/interfaces/${apiName}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  deleteInterface(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/interfaces/${apiName}`);
  }

  // ============ Link Types ============
  listLinkTypes(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/linkTypes`);
  }

  getOutgoingLinkTypes(ontologyRid: string, objectTypeApiName: string) {
    return this.request<{ data: any[] }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/outgoingLinkTypes`,
    );
  }

  createForeignKeyLink(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/linkTypes/foreignKey`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  createJoinTableLink(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/linkTypes/joinTable`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  createObjectBackedLink(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/linkTypes/objectBacked`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  deleteLinkType(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/linkTypes/${apiName}`);
  }

  /** Generic link type creation - used by builder-mode */
  createLinkType(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/linkTypes`,
      { method: 'POST', body: JSON.stringify(input) },
    );
  }

  updateLinkType(rid: string, apiName: string, updates: Partial<LinkTypeUpdate>): Promise<{ data: any }> {
    return this.request(`/api/ontologies/${rid}/linkTypes/${apiName}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============ Shared Properties ============
  listSharedProperties(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/sharedProperties`);
  }

  createSharedProperty(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/sharedProperties`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  deleteSharedProperty(ontologyRid: string, apiName: string, interfaceApiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/sharedProperties/${apiName}?interfaceApiName=${encodeURIComponent(interfaceApiName)}`);
  }

  updateSharedProperty(ontologyRid: string, sharedPropertyApiName: string, interfaceApiName: string, data: any) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/sharedProperties/${sharedPropertyApiName}?interfaceApiName=${encodeURIComponent(interfaceApiName)}`,
      { method: 'PUT', body: JSON.stringify(data) },
    );
  }

  // ============ Constant Properties ============
  listConstantProperties(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/constantProperties`);
  }

  getConstantProperty(ontologyRid: string, apiName: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/constantProperties/${apiName}`);
  }

  createConstantProperty(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/constantProperties`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  deleteConstantProperty(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/constantProperties/${apiName}`);
  }

  // ============ Action Types ============
  listActionTypes(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/actionTypes`);
  }

  createActionType(ontologyRid: string, input: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/actionTypes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  deleteActionType(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/actionTypes/${apiName}`);
  }

  updateActionType(rid: string, apiName: string, updates: Partial<ActionTypeUpdate>): Promise<{ data: any }> {
    return this.request(`/api/ontologies/${rid}/actionTypes/${apiName}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // ============ Functions ============
  listFunctions(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/functions`);
  }

  createFunction(ontologyRid: string, data: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/functions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateFunction(ontologyRid: string, apiName: string, data: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/functions/${apiName}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  deleteFunction(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/functions/${apiName}`);
  }

  executeFunction(ontologyRid: string, apiName: string, parameters: Record<string, any>) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/functions/${apiName}/execute`,
      { method: 'POST', body: JSON.stringify({ parameters }) },
    );
  }

  // ============ Groups ============
  listGroups(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/groups`);
  }

  updateObjectTypeGroups(ontologyRid: string, objectTypeApiName: string, groups: Array<{ apiName: string; displayName: string }>) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/groups`,
      { method: 'PUT', body: JSON.stringify({ groups }) },
    );
  }

  // ============ Query API Gateway (Palantir aligned) ============
  executeQuery(ontologyRid: string, queryApiName: string, params?: Record<string, string>) {
    const query = new URLSearchParams(params);
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/queries/${queryApiName}?${query}`,
    );
  }

  // ============ Object Views ============
  listObjectViews(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/objectViews`);
  }

  createObjectView(ontologyRid: string, data: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/objectViews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteObjectView(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/objectViews/${apiName}`);
  }

  getObjectView(ontologyRid: string, objectViewApiName: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/objectViews/${objectViewApiName}`);
  }

  listObjectViewsByObjectType(ontologyRid: string, objectTypeApiName: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/objectViews?objectTypeApiName=${encodeURIComponent(objectTypeApiName)}`);
  }

  updateObjectView(ontologyRid: string, objectViewApiName: string, data: any) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectViews/${objectViewApiName}`,
      { method: 'PUT', body: JSON.stringify(data) },
    );
  }

  setDefaultObjectView(ontologyRid: string, objectViewApiName: string) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectViews/${objectViewApiName}/setDefault`,
      { method: 'POST' },
    );
  }

  getObject(ontologyRid: string, objectTypeApiName: string, objectRid: string) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects/${objectRid}`,
    );
  }

  createLink(ontologyRid: string, linkTypeApiName: string, aSideRid: string, bSideRid: string, properties?: Record<string, any>) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/linkTypes/${linkTypeApiName}/links`,
      { method: 'POST', body: JSON.stringify({ aSideRid, bSideRid, properties }) },
    );
  }

  listLinksByLinkType(ontologyRid: string, linkTypeApiName: string, options?: { relationLevel?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (options?.relationLevel) params.set('relationLevel', options.relationLevel);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));
    const qs = params.toString();
    return this.request<{ data: any[]; total: number }>(
      `/api/ontologies/${ontologyRid}/linkTypes/${linkTypeApiName}/links${qs ? `?${qs}` : ''}`,
    );
  }

  deleteLink(ontologyRid: string, linkTypeApiName: string, linkRid: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/linkTypes/${linkTypeApiName}/links/${linkRid}`);
  }

  // ============ Workshops ============
  listWorkshops(ontologyRid: string) {
    return this.request<{ data: any[] }>(`/api/ontologies/${ontologyRid}/workshops`);
  }

  createWorkshop(ontologyRid: string, data: any) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/workshops`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteWorkshop(ontologyRid: string, apiName: string) {
    return this.deleteRequest(`/api/ontologies/${ontologyRid}/workshops/${apiName}`);
  }

  // ============ Object Instances ============
  listObjects(ontologyRid: string, objectTypeApiName: string, params?: { limit?: number; offset?: number; where?: Record<string, any> }) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.where) query.set('where', JSON.stringify(params.where));
    return this.request<{ data: any[] }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects?${query}`,
    );
  }

  /**
   * Search object instances across all object types in an ontology
   * Supports filtering by entityLevel (ClassEntity or ObjectEntity)
   */
  searchObjects(
    ontologyRid: string,
    params?: {
      limit?: number;
      offset?: number;
      search?: string;
      entityLevel?: string;
      objectTypeApiName?: string;
    }
  ) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.search) query.set('search', params.search);
    if (params?.entityLevel) query.set('entityLevel', params.entityLevel);
    if (params?.objectTypeApiName) query.set('objectTypeApiName', params.objectTypeApiName);
    return this.request<{ data: any[]; total: number }>(
      `/api/ontologies/${ontologyRid}/objects?${query}`,
    );
  }

  // ============ Object Classes (ClassEntity level instances) ============
  /**
   * Get Object Classes (instances with entityLevel='ClassEntity') for a specific ObjectType
   * Used for querying class-level entities like Projects with isTargetProject flag
   */
  async getObjectClasses(
    ontologyRid: string,
    objectTypeApiName: string,
    options?: {
      limit?: number;
      where?: Record<string, any>;
      metaKind?: string;
    }
  ): Promise<{ data: any[] }> {
    const query = new URLSearchParams();
    if (options?.limit) query.set('limit', String(options.limit));

    // Pass entityLevel as a separate parameter (not in where)
    query.set('entityLevel', 'ClassEntity');

    // Pass properties filter in where
    if (options?.where) {
      query.set('where', JSON.stringify(options.where));
    }

    const result = await this.request<{ data: any[] }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects?${query}`,
    );

    // Filter by metaKind if specified
    if (options?.metaKind) {
      result.data = result.data.filter((obj: any) => obj.metaKind === options.metaKind);
    }

    return result;
  }

  createObject(ontologyRid: string, objectTypeApiName: string, properties: Record<string, any>) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects`,
      { method: 'POST', body: JSON.stringify({ properties }) },
    );
  }

  updateObject(ontologyRid: string, objectTypeApiName: string, objectRid: string, properties: Record<string, any>, version?: number) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects/${objectRid}`,
      { method: 'PUT', body: JSON.stringify({ properties, version }) },
    );
  }

  /** Alias for updateObject - used by builder-mode */
  updateObjectClass(ontologyRid: string, objectTypeApiName: string, objectRid: string, properties: Record<string, any>, version?: number) {
    return this.updateObject(ontologyRid, objectTypeApiName, objectRid, properties, version);
  }

  deleteObject(ontologyRid: string, objectTypeApiName: string, objectRid: string) {
    return this.deleteRequest(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/objects/${objectRid}`,
    );
  }

  // ============ Action Execution ============
  applyAction(ontologyRid: string, actionTypeApiName: string, parameters: Record<string, any>) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/actionTypes/${actionTypeApiName}/apply`,
      { method: 'POST', body: JSON.stringify({ parameters }) },
    );
  }

  // ============ Transactions (SDK-aligned) ============
  /**
   * Execute a batch of transaction edits atomically.
   * SDK: postTransactionEdits(ontologyRid, { edits })
   */
  executeTransaction(ontologyRid: string, edits: any[]) {
    return this.request<{ data: { transactionId: string } }>(
      `/api/ontologies/${ontologyRid}/transactions`,
      { method: 'POST', body: JSON.stringify({ edits }) },
    );
  }

  // ============ Full Metadata (SDK-aligned) ============
  /**
   * Get complete Ontology metadata snapshot.
   * SDK: getFullMetadata(ontologyRid)
   * Returns all object types, action types, interfaces, value types, etc.
   */
  getFullMetadata(ontologyRid: string) {
    return this.request<{ data: any }>(`/api/ontologies/${ontologyRid}/fullMetadata`);
  }

  // ============ Linked Objects (SDK-aligned) ============
  /**
   * Get objects linked to a specific object.
   * SDK: getLinkedObjects(ontologyRid, objectRid, options)
   */
  getLinkedObjects(ontologyRid: string, objectRid: string, options?: { linkTypeApiName?: string; direction?: string; relationLevel?: string }) {
    const query = new URLSearchParams();
    if (options?.linkTypeApiName) query.set('linkTypeApiName', options.linkTypeApiName);
    if (options?.direction) query.set('direction', options.direction);
    if (options?.relationLevel) query.set('relationLevel', options.relationLevel);
    return this.request<{ data: any[] }>(
      `/api/ontologies/${ontologyRid}/objects/${objectRid}/links?${query}`,
    );
  }

  // ============ ObjectSet Query (SDK-aligned) ============
  /**
   * Execute an ObjectSet query with filtering, aggregation, sorting, and pagination.
   * SDK: aggregateObjectSet / getObjects (simplified)
   */
  queryObjectSet(ontologyRid: string, objectTypeApiName: string, query: any) {
    return this.request<{ data: any }>(
      `/api/ontologies/${ontologyRid}/objectTypes/${objectTypeApiName}/query`,
      { method: 'POST', body: JSON.stringify(query) },
    );
  }

  // ============ Health Issues ============
  getHealthOverview(ontologyRid: string) {
    return this.request<{ data: { total: number; healthy: number; warning: number; critical: number; lastChecked: string } }>(
      `/api/ontologies/${ontologyRid}/health/overview`
    );
  }

  getHealthIssues(ontologyRid: string, params?: { category?: string; severity?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/ontologies/${ontologyRid}/health/issues${queryParams ? `?${queryParams}` : ''}`
    );
  }

  dismissHealthIssue(ontologyRid: string, issueId: string, reason?: string) {
    return this.request<{ data: { success: boolean } }>(
      `/api/ontologies/${ontologyRid}/health/issues/${issueId}/dismiss`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
  }

  batchDismissHealthIssues(ontologyRid: string, issueIds: string[], reason?: string) {
    return this.request<{ data: { success: boolean; dismissedCount: number } }>(
      `/api/ontologies/${ontologyRid}/health/issues/batch-dismiss`,
      { method: 'POST', body: JSON.stringify({ issueIds, reason }) }
    );
  }

  retryHealthIssue(ontologyRid: string, issueId: string) {
    return this.request<{ data: { success: boolean } }>(
      `/api/ontologies/${ontologyRid}/health/issues/${issueId}/retry`,
      { method: 'POST' }
    );
  }

  reindexHealthIssue(ontologyRid: string, issueId: string) {
    return this.request<{ data: { success: boolean } }>(
      `/api/ontologies/${ontologyRid}/health/issues/${issueId}/reindex`,
      { method: 'POST' }
    );
  }

  // ============ Cleanup ============
  getCleanupUsage(ontologyRid: string) {
    return this.request<{ data: { compute: { used: number; limit: number; unit: string }; storage: { used: number; limit: number; unit: string }; objects: { used: number; limit: number; unit: string } } }>(
      `/api/ontologies/${ontologyRid}/cleanup/usage`
    );
  }

  getDeprecatedResources(ontologyRid: string, params?: { type?: string; status?: string; sort?: string; order?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    return this.request<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/ontologies/${ontologyRid}/cleanup/deprecated${queryParams ? `?${queryParams}` : ''}`
    );
  }

  getDeprecatedImpact(ontologyRid: string, resourceId: string) {
    return this.request<{ data: { resourceType: string; resourceName: string; objectCount: number; apps: any[] } }>(
      `/api/ontologies/${ontologyRid}/cleanup/deprecated/${resourceId}/impact`
    );
  }

  deleteDeprecatedResource(ontologyRid: string, resourceId: string) {
    return this.request<{ data: { success: boolean } }>(
      `/api/ontologies/${ontologyRid}/cleanup/deprecated/${resourceId}/delete`,
      { method: 'POST' }
    );
  }

  extendDeprecatedDeadline(ontologyRid: string, resourceId: string, deadline: string) {
    return this.request<{ data: { success: boolean; newDeadline: string } }>(
      `/api/ontologies/${ontologyRid}/cleanup/deprecated/${resourceId}/extend`,
      { method: 'POST', body: JSON.stringify({ deadline }) }
    );
  }
}

export const apiClient = new OntologyApiClient();
export type { ApiError };
