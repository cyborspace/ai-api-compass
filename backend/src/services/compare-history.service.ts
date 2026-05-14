export interface CompareHistoryData {
  id: string;
  userId: string;
  modelIds: string[];
  compareType: string;
  createdAt: Date;
}

const compareHistoryStore = new Map<string, CompareHistoryData[]>();

class CompareHistoryService {
  async create(userId: string, modelIds: string[], compareType: string = 'products'): Promise<CompareHistoryData> {
    const data: CompareHistoryData = {
      id: `ch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      modelIds,
      compareType,
      createdAt: new Date(),
    };
    const histories = compareHistoryStore.get(userId) || [];
    histories.unshift(data);
    compareHistoryStore.set(userId, histories.slice(0, 20));
    return data;
  }

  async findByUser(userId: string, limit: number = 10): Promise<CompareHistoryData[]> {
    const histories = compareHistoryStore.get(userId) || [];
    return histories.slice(0, limit);
  }

  async delete(id: string, userId: string): Promise<void> {
    const histories = compareHistoryStore.get(userId) || [];
    compareHistoryStore.set(userId, histories.filter(h => h.id !== id));
  }

  async clearAll(userId: string): Promise<void> {
    compareHistoryStore.delete(userId);
  }
}

export const compareHistoryService = new CompareHistoryService();