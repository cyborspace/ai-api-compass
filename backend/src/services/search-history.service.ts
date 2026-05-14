// ============================================================
// Search History Service - 搜索历史服务
// ============================================================

interface SearchHistoryRecord {
  id: string;
  userId: string;
  query: string;
  resultsCount?: number;
  searchedAt: Date;
}

const searchHistoryStore = new Map<string, SearchHistoryRecord[]>();

export class SearchHistoryService {
  async create(userId: string, query: string, resultsCount?: number): Promise<SearchHistoryRecord> {
    const records = searchHistoryStore.get(userId) || [];
    const existing = records.find(r => r.query === query);

    if (existing) {
      existing.searchedAt = new Date();
      existing.resultsCount = resultsCount;
      return existing;
    }

    const newRecord: SearchHistoryRecord = {
      id: `sh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      query,
      resultsCount,
      searchedAt: new Date(),
    };
    records.unshift(newRecord);
    searchHistoryStore.set(userId, records.slice(0, 100));
    return newRecord;
  }

  async getByUser(userId: string, limit: number = 20): Promise<SearchHistoryRecord[]> {
    const records = searchHistoryStore.get(userId) || [];
    return records.slice(0, limit);
  }

  async delete(id: string, userId: string): Promise<void> {
    const records = searchHistoryStore.get(userId) || [];
    searchHistoryStore.set(userId, records.filter(r => r.id !== id));
  }

  async clearAll(userId: string): Promise<void> {
    searchHistoryStore.delete(userId);
  }

  async getTotalCount(userId: string): Promise<number> {
    return searchHistoryStore.get(userId)?.length || 0;
  }
}

export const searchHistoryService = new SearchHistoryService();
