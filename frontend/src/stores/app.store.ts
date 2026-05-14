/**
 * App State Store - Zustand
 * Palantir 风格：集中式状态管理，不可变数据流
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIGCTool, ToolCategory, RankingType, PerspectiveType } from '@/types/api';

// =============================================================================
// Types
// =============================================================================

export interface ClickRecord {
  slug: string;
  timestamp: number;
  type: 'like' | 'view' | 'compare' | 'detail';
}

export interface ToolHeatData {
  slug: string;
  baseHeat: number;
  clickBoost: number;
  totalHeat: number;
  trendScore: number;
  clickCount: number;
  likeCount: number;
  viewCount: number;
  lastClickTime: number;
  firstClickTime: number;
  hourlyClicks: number[];
}

export interface DataCorrection {
  id: string;
  slug: string;
  field: string;
  originalValue: any;
  correctedValue: any;
  timestamp: number;
  applied: boolean;
}

export interface DataCorrectionState {
  corrections: DataCorrection[];
  correctedTools: Record<string, Record<string, any>>;
}

interface CompareState {
  selectedTools: AIGCTool[];
  maxTools: number;
}

interface FavoriteState {
  toolSlugs: string[];
}

interface ClickTrackingState {
  clickHistory: ClickRecord[];
  heatData: Record<string, ToolHeatData>;
  totalLikes: number;
}

interface DynamicImpactState {
  isSimulating: boolean;
  lastImpact: {
    slug: string;
    changeType: 'rank' | 'heat' | 'score';
    oldValue: number;
    newValue: number;
    timestamp: number;
  } | null;
}

interface FilterState {
  searchQuery: string;
  selectedCategories: string[];
  pricingTypes: string[];
  capabilities: string[];
  availableInChina: boolean | null;
  sortBy: 'relevance' | 'rating' | 'price_asc' | 'price_desc' | 'heat';
}

interface ViewState {
  layout: 'grid' | 'list' | 'table';
  sidebarCollapsed: boolean;
  detailPanelOpen: boolean;
  selectedTool: AIGCTool | null;
}

interface AppState {
  // Compare
  compare: CompareState;
  addToCompare: (tool: AIGCTool) => void;
  removeFromCompare: (slug: string) => void;
  clearCompare: () => void;

  // Favorite
  favorite: FavoriteState;
  addToFavorite: (slug: string) => void;
  removeFromFavorite: (slug: string) => void;
  toggleFavorite: (slug: string) => void;
  clearFavorites: () => void;
  isFavorite: (slug: string) => boolean;

  // Click Tracking
  clickTracking: ClickTrackingState;
  recordClick: (slug: string, type: ClickRecord['type']) => void;
  getToolHeat: (slug: string) => ToolHeatData | null;
  getClickHistory: () => ClickRecord[];
  resetClickTracking: () => void;
  simulateImpact: (slug: string, type: 'like' | 'view') => void;

  // Dynamic Impact
  dynamicImpact: DynamicImpactState;
  setLastImpact: (impact: DynamicImpactState['lastImpact']) => void;
  clearImpact: () => void;

  // Data Correction
  dataCorrection: DataCorrectionState;
  applyCorrection: (slug: string, field: string, originalValue: any, correctedValue: any) => void;
  revertCorrection: (correctionId: string) => void;
  getCorrectedValue: (slug: string, field: string) => any | null;
  getAllCorrections: () => DataCorrection[];
  clearAllCorrections: () => void;

  // Filter
  filter: FilterState;
  setSearchQuery: (query: string) => void;
  toggleCategory: (slug: string) => void;
  togglePricingType: (type: string) => void;
  toggleCapability: (cap: string) => void;
  setAvailableInChina: (value: boolean | null) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  clearFilters: () => void;

  // View
  view: ViewState;
  setLayout: (layout: ViewState['layout']) => void;
  toggleSidebar: () => void;
  setSelectedTool: (tool: AIGCTool | null) => void;
  toggleDetailPanel: () => void;

  // Ranking
  activeRankingType: RankingType;
  activePerspective: PerspectiveType;
  setActiveRankingType: (type: RankingType) => void;
  setActivePerspective: (p: PerspectiveType) => void;
}

const DEFAULT_FILTER: FilterState = {
  searchQuery: '',
  selectedCategories: [],
  pricingTypes: [],
  capabilities: [],
  availableInChina: null,
  sortBy: 'relevance',
};

// =============================================================================
// Store
// =============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Compare
      compare: { selectedTools: [], maxTools: 4 },
      addToCompare: (tool) =>
        set((state) => {
          if (state.compare.selectedTools.find((t) => t.slug === tool.slug)) return state;
          if (state.compare.selectedTools.length >= state.compare.maxTools) return state;
          return {
            compare: {
              ...state.compare,
              selectedTools: [...state.compare.selectedTools, tool],
            },
          };
        }),
      removeFromCompare: (slug) =>
        set((state) => ({
          compare: {
            ...state.compare,
            selectedTools: state.compare.selectedTools.filter((t) => t.slug !== slug),
          },
        })),
      clearCompare: () =>
        set((state) => ({
          compare: { ...state.compare, selectedTools: [] },
        })),

      // Favorite
      favorite: { toolSlugs: [] },
      addToFavorite: (slug) =>
        set((state) => {
          if (state.favorite.toolSlugs.includes(slug)) return state;
          return {
            favorite: {
              ...state.favorite,
              toolSlugs: [...state.favorite.toolSlugs, slug],
            },
          };
        }),
      removeFromFavorite: (slug) =>
        set((state) => ({
          favorite: {
            ...state.favorite,
            toolSlugs: state.favorite.toolSlugs.filter((s) => s !== slug),
          },
        })),
      toggleFavorite: (slug) => {
        const state = get();
        if (state.favorite.toolSlugs.includes(slug)) {
          get().removeFromFavorite(slug);
        } else {
          get().addToFavorite(slug);
        }
      },
      clearFavorites: () =>
        set((state) => ({
          favorite: { ...state.favorite, toolSlugs: [] },
        })),
      isFavorite: (slug) => get().favorite.toolSlugs.includes(slug),

      // Click Tracking
      clickTracking: {
        clickHistory: [],
        heatData: {},
        totalLikes: 0,
      },
      recordClick: (slug, type) =>
        set((state) => {
          const record: ClickRecord = { slug, timestamp: Date.now(), type };
          const newHistory = [...state.clickTracking.clickHistory, record];
          
          const existingHeat = state.clickTracking.heatData[slug];
          const now = Date.now();
          
          const clickWeights: Record<string, number> = {
            like: 10,
            view: 1,
            compare: 2,
            detail: 3,
          };
          const weight = clickWeights[type] || 1;
          
          const baseHeat = existingHeat?.baseHeat || Math.random() * 50 + 50;
          const clickBoost = (existingHeat?.clickBoost || 0) + weight;
          const clickCount = (existingHeat?.clickCount || 0) + 1;
          const likeCount = type === 'like' ? (existingHeat?.likeCount || 0) + 1 : (existingHeat?.likeCount || 0);
          const viewCount = type === 'view' ? (existingHeat?.viewCount || 0) + 1 : (existingHeat?.viewCount || 0);
          const firstClickTime = existingHeat?.firstClickTime || now;
          
          const timeSinceLastClick = existingHeat ? now - existingHeat.lastClickTime : 0;
          const timeSinceFirstClick = now - firstClickTime;
          
          const timeDecay = existingHeat 
            ? Math.pow(0.95, timeSinceLastClick / 3600000)
            : 1;
          
          const avgClicksPerHour = clickCount / Math.max(1, timeSinceFirstClick / 3600000);
          const recentClicks = existingHeat?.hourlyClicks.slice(-6).reduce((a, b) => a + b, 0) || 0;
          const trendScore = avgClicksPerHour > 0 ? recentClicks / (avgClicksPerHour * 6) : 1;
          
          const hours = Math.floor(timeSinceFirstClick / 3600000);
          const gravity = 1 + hours * 0.1;
          
          const totalHeat = baseHeat + (clickBoost * timeDecay * trendScore) / gravity;
          
          const newHourlyClicks = existingHeat?.hourlyClicks || [];
          const currentHourIndex = Math.floor(now / 3600000);
          if (newHourlyClicks.length === 0 || Math.floor(existingHeat?.lastClickTime / 3600000) !== currentHourIndex) {
            newHourlyClicks.push(1);
          } else {
            newHourlyClicks[newHourlyClicks.length - 1]++;
          }

          return {
            clickTracking: {
              ...state.clickTracking,
              clickHistory: newHistory.slice(-200),
              heatData: {
                ...state.clickTracking.heatData,
                [slug]: {
                  slug,
                  baseHeat,
                  clickBoost,
                  totalHeat,
                  trendScore,
                  clickCount,
                  likeCount,
                  viewCount,
                  lastClickTime: now,
                  firstClickTime,
                  hourlyClicks: newHourlyClicks.slice(-24),
                },
              },
              totalLikes: type === 'like' ? state.clickTracking.totalLikes + 1 : state.clickTracking.totalLikes,
            },
          };
        }),
      getToolHeat: (slug) => get().clickTracking.heatData[slug] || null,
      getClickHistory: () => get().clickTracking.clickHistory,
      resetClickTracking: () =>
        set((state) => ({
          clickTracking: {
            ...state.clickTracking,
            clickHistory: [],
            heatData: {},
            totalLikes: 0,
          },
        })),
      simulateImpact: (slug, type) => {
        get().recordClick(slug, type);
        const heatData = get().clickTracking.heatData[slug];
        if (heatData) {
          const impact = {
            slug,
            changeType: 'heat' as const,
            oldValue: heatData.baseHeat,
            newValue: heatData.totalHeat,
            timestamp: Date.now(),
          };
          get().setLastImpact(impact);
        }
      },

      // Dynamic Impact
      dynamicImpact: {
        isSimulating: false,
        lastImpact: null,
      },
      setLastImpact: (impact) =>
        set((state) => ({
          dynamicImpact: {
            ...state.dynamicImpact,
            lastImpact: impact,
          },
        })),
      clearImpact: () =>
        set((state) => ({
          dynamicImpact: {
            ...state.dynamicImpact,
            lastImpact: null,
          },
        })),

      // Data Correction
      dataCorrection: {
        corrections: [],
        correctedTools: {},
      },
      applyCorrection: (slug, field, originalValue, correctedValue) =>
        set((state) => {
          const correction: DataCorrection = {
            id: `${slug}-${field}-${Date.now()}`,
            slug,
            field,
            originalValue,
            correctedValue,
            timestamp: Date.now(),
            applied: true,
          };

          const existingTool = state.dataCorrection.correctedTools[slug] || {};
          const newCorrectedTools = {
            ...state.dataCorrection.correctedTools,
            [slug]: {
              ...existingTool,
              [field]: correctedValue,
            },
          };

          return {
            dataCorrection: {
              corrections: [...state.dataCorrection.corrections, correction],
              correctedTools: newCorrectedTools,
            },
          };
        }),
      revertCorrection: (correctionId) =>
        set((state) => {
          const correction = state.dataCorrection.corrections.find((c) => c.id === correctionId);
          if (!correction) return state;

          const correctedTools = { ...state.dataCorrection.correctedTools };
          const toolCorrections = correctedTools[correction.slug];
          if (toolCorrections) {
            const newToolCorrections = { ...toolCorrections };
            delete newToolCorrections[correction.field];
            if (Object.keys(newToolCorrections).length === 0) {
              delete correctedTools[correction.slug];
            } else {
              correctedTools[correction.slug] = newToolCorrections;
            }
          }

          return {
            dataCorrection: {
              corrections: state.dataCorrection.corrections.filter((c) => c.id !== correctionId),
              correctedTools,
            },
          };
        }),
      getCorrectedValue: (slug, field) => {
        const tool = get().dataCorrection.correctedTools[slug];
        return tool?.[field] ?? null;
      },
      getAllCorrections: () => get().dataCorrection.corrections,
      clearAllCorrections: () =>
        set((state) => ({
          dataCorrection: {
            corrections: [],
            correctedTools: {},
          },
        })),

      // Filter
      filter: DEFAULT_FILTER,
      setSearchQuery: (query) =>
        set((state) => ({ filter: { ...state.filter, searchQuery: query } })),
      toggleCategory: (slug) =>
        set((state) => ({
          filter: {
            ...state.filter,
            selectedCategories: state.filter.selectedCategories.includes(slug)
              ? state.filter.selectedCategories.filter((s) => s !== slug)
              : [...state.filter.selectedCategories, slug],
          },
        })),
      togglePricingType: (type) =>
        set((state) => ({
          filter: {
            ...state.filter,
            pricingTypes: state.filter.pricingTypes.includes(type)
              ? state.filter.pricingTypes.filter((t) => t !== type)
              : [...state.filter.pricingTypes, type],
          },
        })),
      toggleCapability: (cap) =>
        set((state) => ({
          filter: {
            ...state.filter,
            capabilities: state.filter.capabilities.includes(cap)
              ? state.filter.capabilities.filter((c) => c !== cap)
              : [...state.filter.capabilities, cap],
          },
        })),
      setAvailableInChina: (value) =>
        set((state) => ({ filter: { ...state.filter, availableInChina: value } })),
      setSortBy: (sort) =>
        set((state) => ({ filter: { ...state.filter, sortBy: sort } })),
      clearFilters: () => set({ filter: DEFAULT_FILTER }),

      // View
      view: {
        layout: 'grid',
        sidebarCollapsed: false,
        detailPanelOpen: false,
        selectedTool: null,
      },
      setLayout: (layout) =>
        set((state) => ({ view: { ...state.view, layout } })),
      toggleSidebar: () =>
        set((state) => ({
          view: { ...state.view, sidebarCollapsed: !state.view.sidebarCollapsed },
        })),
      setSelectedTool: (tool) =>
        set((state) => ({ view: { ...state.view, selectedTool: tool } })),
      toggleDetailPanel: () =>
        set((state) => ({
          view: { ...state.view, detailPanelOpen: !state.view.detailPanelOpen },
        })),

      // Ranking
      activeRankingType: 'composite',
      activePerspective: 'default',
      setActiveRankingType: (type) => set({ activeRankingType: type }),
      setActivePerspective: (p) => set({ activePerspective: p }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        compare: state.compare,
        favorite: state.favorite,
        view: { ...state.view, selectedTool: null },
        activeRankingType: state.activeRankingType,
        activePerspective: state.activePerspective,
        clickTracking: state.clickTracking,
        dataCorrection: state.dataCorrection,
      }),
    }
  )
);
