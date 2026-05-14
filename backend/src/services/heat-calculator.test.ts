/**
 * Heat Calculator Service Tests
 * 验证热度计算服务的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HeatCalculator, EVENT_WEIGHTS, HEAT_LEVELS, PERIOD_DURATIONS } from './heat-calculator';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrisma = {
  user_events: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
  },
  tool_heat_snapshots: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  tool_heat_history: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
} as unknown as PrismaClient;

describe('HeatCalculator', () => {
  let calculator: HeatCalculator;

  beforeEach(() => {
    calculator = new HeatCalculator(mockPrisma);
    vi.clearAllMocks();
  });

  describe('Event Weights', () => {
    it('should have correct default weights', () => {
      expect(EVENT_WEIGHTS.search).toBe(0.15);
      expect(EVENT_WEIGHTS.click).toBe(0.30);
      expect(EVENT_WEIGHTS.compare).toBe(0.20);
      expect(EVENT_WEIGHTS.bookmark).toBe(0.25);
      expect(EVENT_WEIGHTS.share).toBe(0.10);
    });
  });

  describe('Heat Levels', () => {
    it('should have 6 heat levels', () => {
      expect(HEAT_LEVELS).toHaveLength(6);
    });

    it('should have correct level ranges', () => {
      expect(HEAT_LEVELS[0].level).toBe('FROZEN');
      expect(HEAT_LEVELS[0].minScore).toBe(0);
      expect(HEAT_LEVELS[HEAT_LEVELS.length - 1].level).toBe('VIRAL');
    });
  });

  describe('Period Durations', () => {
    it('should have correct durations in milliseconds', () => {
      expect(PERIOD_DURATIONS['1h']).toBe(60 * 60 * 1000);
      expect(PERIOD_DURATIONS['24h']).toBe(24 * 60 * 60 * 1000);
      expect(PERIOD_DURATIONS['7d']).toBe(7 * 24 * 60 * 60 * 1000);
      expect(PERIOD_DURATIONS['30d']).toBe(30 * 24 * 60 * 60 * 1000);
    });
  });

  describe('recordEvent', () => {
    it('should create event with correct data structure', async () => {
      const mockEvent = {
        id: 'test-id',
        toolRid: 'tool-1',
        eventType: 'click' as const,
        userId: 'user-1',
        sessionId: 'session-1',
        metadata: {},
        weight: 0.30,
      };

      (mockPrisma.user_events.create as any).mockResolvedValue(mockEvent);

      const result = await calculator.recordEvent({
        toolRid: 'tool-1',
        eventType: 'click',
        userId: 'user-1',
        sessionId: 'session-1',
      });

      expect(mockPrisma.user_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          toolRid: 'tool-1',
          eventType: 'click',
          userId: 'user-1',
          sessionId: 'session-1',
          metadata: {},
          weight: 0.30,
        }),
      });
      expect(result).toEqual(mockEvent);
    });

    it('should use custom weight when provided', async () => {
      const mockEvent = {
        id: 'test-id',
        toolRid: 'tool-1',
        eventType: 'click' as const,
        weight: 0.5,
      };

      (mockPrisma.user_events.create as any).mockResolvedValue(mockEvent);

      await calculator.recordEvent({
        toolRid: 'tool-1',
        eventType: 'click',
        weight: 0.5,
      });

      expect(mockPrisma.user_events.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          weight: 0.5,
        }),
      });
    });
  });

  describe('recordEvents (batch)', () => {
    it('should create multiple events with IDs', async () => {
      (mockPrisma.user_events.createMany as any).mockResolvedValue({ count: 2 });

      const result = await calculator.recordEvents([
        { toolRid: 'tool-1', eventType: 'click' as const },
        { toolRid: 'tool-2', eventType: 'search' as const },
      ]);

      expect(mockPrisma.user_events.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            toolRid: 'tool-1',
            eventType: 'click',
          }),
          expect.objectContaining({
            id: expect.any(String),
            toolRid: 'tool-2',
            eventType: 'search',
          }),
        ]),
        skipDuplicates: true,
      });
      expect(result).toBe(2);
    });
  });

  describe('saveHeatSnapshot', () => {
    it('should upsert with correct data including id and updatedAt', async () => {
      const mockResult = { id: 'snapshot-1', toolRid: 'tool-1', period: '24h' as const };
      (mockPrisma.tool_heat_snapshots.upsert as any).mockResolvedValue(mockResult);

      const heatResult = {
        toolRid: 'tool-1',
        period: '24h' as const,
        heatScore: 75,
        rawScore: 100,
        eventCount: 50,
        weightedScore: 80,
        decayFactor: 0.95,
        trend: 'rising' as const,
        trendChange: 0.15,
        previousScore: 70,
        level: 'HOT' as const,
        levelIcon: '🔥',
        levelLabel: '爆款',
      };

      await calculator.saveHeatSnapshot(heatResult);

      expect(mockPrisma.tool_heat_snapshots.upsert).toHaveBeenCalledWith({
        where: {
          toolRid_period: {
            toolRid: 'tool-1',
            period: '24h',
          },
        },
        update: expect.objectContaining({
          heatScore: 75,
          rawScore: 100,
          eventCount: 50,
          weightedScore: 80,
          decayFactor: 0.95,
          trend: 'rising',
          trendChange: 0.15,
          previousScore: 70,
          level: 'HOT',
          levelIcon: '🔥',
          calculatedAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          id: expect.any(String),
          toolRid: 'tool-1',
          period: '24h',
          heatScore: 75,
          rawScore: 100,
          eventCount: 50,
          weightedScore: 80,
          decayFactor: 0.95,
          trend: 'rising',
          trendChange: 0.15,
          previousScore: 70,
          level: 'HOT',
          levelIcon: '🔥',
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('saveHeatHistory', () => {
    it('should create history record with id', async () => {
      const mockResult = { id: 'history-1' };
      (mockPrisma.tool_heat_history.create as any).mockResolvedValue(mockResult);

      const heatResult = {
        toolRid: 'tool-1',
        period: '24h' as const,
        heatScore: 75,
        rawScore: 100,
        eventCount: 50,
        weightedScore: 80,
        decayFactor: 0.95,
        trend: 'rising' as const,
        trendChange: 0.15,
        previousScore: 70,
        level: 'HOT' as const,
        levelIcon: '🔥',
        levelLabel: '爆款',
      };

      await calculator.saveHeatHistory(heatResult);

      expect(mockPrisma.tool_heat_history.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          toolRid: 'tool-1',
          period: '24h',
          heatScore: 75,
          eventCount: 50,
          trend: 'rising',
        }),
      });
    });
  });
});
