'use client';

/**
 * ObjectTypeDetail - ObjectType 详情查看器
 * 展示 ObjectType 的属性、关系、对象实例等
 */

import React, { useState, useCallback } from 'react';
import { request } from '@/lib/api';

interface PropertyDefinition {
  apiName: string;
  displayName: string;
  description?: string;
  baseType: string;
  valueType?: string;
  isRequired?: boolean;
  constraints?: Record<string, unknown>;
}

interface ObjectType {
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
  objectsCount?: number;
  linkedObjectTypes?: Array<{
    linkTypeApiName: string;
    targetObjectTypeApiName: string;
    direction: 'outbound' | 'inbound';
    cardinality: string;
  }>;
}

interface OntologyObject {
  id: string;
  rid: string;
  objectTypeId: string;
  properties: Record<string, unknown>;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ObjectTypeDetailProps {
  objectType: ObjectType | null;
  ontologyRid: string;
  onObjectSelect?: (object: OntologyObject) => void;
  onLinkedObjectClick?: (objectTypeApiName: string, objectId: string) => void;
}

export function ObjectTypeDetail({
  objectType,
  ontologyRid,
  onObjectSelect,
  onLinkedObjectClick,
}: ObjectTypeDetailProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'instances' | 'links'>('properties');
  const [instances, setInstances] = useState<OntologyObject[]>([]);
  const [isLoadingInstances, setIsLoadingInstances] = useState(false);
  const [instancesPage, setInstancesPage] = useState({ offset: 0, limit: 20, total: 0 });

  // 加载对象实例
  const loadInstances = useCallback(async (reset = false) => {
    if (!objectType) return;
    
    setIsLoadingInstances(true);
    const offset = reset ? 0 : instancesPage.offset;
    
    try {
      const response = await request<{
        data: OntologyObject[];
        total: number;
        limit: number;
        offset: number;
      }>(
        `/api/ontologies/${ontologyRid}/objectTypes/${objectType.apiName}/objects?limit=${instancesPage.limit}&offset=${offset}`
      );
      
      setInstances(reset ? response.data || [] : [...instances, ...(response.data || [])]);
      setInstancesPage({
        offset: response.offset + response.limit,
        limit: response.limit,
        total: response.total,
      });
    } catch (error) {
      console.error('Failed to load instances:', error);
    } finally {
      setIsLoadingInstances(false);
    }
  }, [objectType, ontologyRid, instancesPage]);

  // 切换 Tab 时加载数据
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'instances' && instances.length === 0) {
      loadInstances(true);
    }
  }, [instances.length, loadInstances]);

  // 加载更多实例
  const handleLoadMore = useCallback(() => {
    if (!isLoadingInstances && instancesPage.offset < instancesPage.total) {
      loadInstances(false);
    }
  }, [isLoadingInstances, instancesPage, loadInstances]);

  // 类型图标
  const getTypeIcon = (baseType: string) => {
    const icons: Record<string, string> = {
      string: '📝',
      integer: '🔢',
      float: '📊',
      boolean: '✅',
      timestamp: '🕐',
      date: '📅',
      array: '📋',
      object: '📦',
      file: '📎',
    };
    return icons[baseType] || '❓';
  };

  // 状态颜色
  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    deprecated: 'bg-red-100 text-red-700',
    beta: 'bg-blue-100 text-blue-700',
  };

  if (!objectType) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
        选择一个 ObjectType 查看详情
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: objectType.color ? `${objectType.color}20` : '#f3f4f6' }}
          >
            {objectType.icon || '📦'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{objectType.displayName}</h3>
            <div className="flex items-center gap-2 text-sm">
              <code className="text-gray-500">{objectType.apiName}</code>
              <span className={`px-2 py-0.5 rounded text-xs ${statusColors[objectType.status] || 'bg-gray-100 text-gray-600'}`}>
                {objectType.status}
              </span>
            </div>
          </div>
        </div>
        
        {objectType.description && (
          <p className="text-sm text-gray-600 mt-2">{objectType.description}</p>
        )}

        {/* 元信息 */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>RID: <code className="text-gray-700">{objectType.rid}</code></span>
          <span>版本: v{objectType.version}</span>
          <span>主键: {objectType.primaryKeys.join(', ') || '-'}</span>
          <span>Title: {objectType.titleKeys.join(', ') || '-'}</span>
        </div>

        {/* 对象数量 */}
        <div className="mt-2 flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {objectType.objectsCount !== undefined ? `${objectType.objectsCount} 对象` : '加载中...'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['properties', 'instances', 'links'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'properties' && '属性'}
            {tab === 'instances' && '对象实例'}
            {tab === 'links' && '关联关系'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="space-y-3">
            {objectType.properties.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-sm">暂无属性定义</div>
            ) : (
              objectType.properties.map((prop) => (
                <div
                  key={prop.apiName}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-lg">{getTypeIcon(prop.baseType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{prop.displayName}</span>
                      {prop.isRequired && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">
                          必填
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <code>{prop.apiName}</code>
                      <span className="mx-1">•</span>
                      <span className="text-blue-600">{prop.baseType}</span>
                      {prop.valueType && (
                        <>
                          <span className="mx-1">→</span>
                          <span className="text-purple-600">{prop.valueType}</span>
                        </>
                      )}
                    </div>
                    {prop.description && (
                      <div className="text-xs text-gray-600 mt-1">{prop.description}</div>
                    )}
                    {prop.constraints && Object.keys(prop.constraints).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(prop.constraints).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Instances Tab */}
        {activeTab === 'instances' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">
                共 {instancesPage.total} 个对象
              </span>
              <button
                onClick={() => loadInstances(true)}
                disabled={isLoadingInstances}
                className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
              >
                {isLoadingInstances ? '加载中...' : '刷新'}
              </button>
            </div>

            {instances.length === 0 && !isLoadingInstances ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                暂无对象实例
              </div>
            ) : (
              <>
                {instances.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => onObjectSelect?.(obj)}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-gray-500">{obj.id}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        obj.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {obj.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 truncate">
                      {(obj.properties as any)?.name || (obj.properties as any)?.title || (obj.properties as any)?.displayName || JSON.stringify(obj.properties)}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      创建: {new Date(obj.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}

                {instancesPage.offset < instancesPage.total && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingInstances}
                    className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition"
                  >
                    {isLoadingInstances ? '加载中...' : `加载更多 (${instances.length}/${instancesPage.total})`}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-3">
            {!objectType.linkedObjectTypes || objectType.linkedObjectTypes.length === 0 ? (
              <div className="text-center text-gray-400 py-4 text-sm">暂无关联关系</div>
            ) : (
              objectType.linkedObjectTypes.map((link, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => onLinkedObjectClick?.(link.targetObjectTypeApiName, '')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      link.direction === 'outbound' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {link.direction === 'outbound' ? '→ 出站' : '← 入站'}
                    </span>
                    <span className="font-medium text-sm">{link.targetObjectTypeApiName}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Link: <code>{link.linkTypeApiName}</code>
                    <span className="mx-1">•</span>
                    <span>基数: {link.cardinality}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectTypeDetail;
