"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Search, X, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app.store";
import { searchTools } from "@/lib/api";
import type { AIGCTool } from "@/types/api";
import { debounce } from "@/lib/utils";
import Image from "next/image";
import { SearchSuggestionsSkeleton } from "./Skeleton";

interface SearchSuggestion {
  slug: string;
  name: string;
  tagline?: string;
  logoUrl?: string;
  heatScore?: number;
}

export function SearchBar({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
      localStorage.setItem("recent-searches", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recent-searches");
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (q: string) => {
      if (!q.trim()) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await searchTools(q, 6);
        if (res.success && res.data) {
          setSuggestions(
            res.data.map((tool: AIGCTool) => ({
              slug: tool.slug,
              name: tool.name,
              tagline: tool.tagline,
              logoUrl: tool.logoUrl,
              heatScore: tool.heatScore,
            }))
          );
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query);
    setSearchQuery(query);
    setShowSuggestions(false);
    router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const handleSelectSuggestion = (slug: string, name: string) => {
    saveRecentSearch(name);
    setShowSuggestions(false);
    router.push(`/tool/${slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const max = suggestions.length > 0 ? suggestions.length - 1 : -1;
      setSelectedIndex((prev) => (prev < max ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const s = suggestions[selectedIndex];
        handleSelectSuggestion(s.slug, s.name);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showRecent =
    showSuggestions && query.trim() === "" && recentSearches.length > 0;
  const showResults =
    showSuggestions && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#636366]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索 AI 工具..."
          className="w-full pl-10 pr-10 py-2.5 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl text-sm text-[#f5f5f7] placeholder:text-[#636366] focus:outline-none focus:border-[#ff3b30]/50 focus:ring-1 focus:ring-[#ff3b30]/20 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-[#636366] hover:text-[#f5f5f7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Loading */}
          {loading && <SearchSuggestionsSkeleton />}

          {/* Recent searches */}
          {!loading && showRecent && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs text-[#636366] flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  最近搜索
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-[10px] text-[#ff3b30] hover:underline"
                >
                  清除
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    handleSubmit();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#8e8e93] hover:text-[#f5f5f7] hover:bg-[#2c2c2e] transition-all text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-[#636366]" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Search results */}
          {!loading && showResults && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[#636366]">
              未找到相关工具
            </div>
          )}

          {!loading && showResults && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs text-[#636366] flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                建议
              </div>
              {suggestions.map((s, idx) => (
                <button
                  key={s.slug}
                  onClick={() => handleSelectSuggestion(s.slug, s.name)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    selectedIndex === idx
                      ? "bg-[#2c2c2e]"
                      : "hover:bg-[#2c2c2e]/50"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#2c2c2e] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {s.logoUrl ? (
                      <Image
                        src={s.logoUrl}
                        alt={s.name}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-[#8e8e93]">
                        {s.name.slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#f5f5f7] truncate">
                      {s.name}
                    </div>
                    {s.tagline && (
                      <div className="text-xs text-[#636366] truncate">
                        {s.tagline}
                      </div>
                    )}
                  </div>
                  {s.heatScore !== undefined && (
                    <div className="text-xs text-[#ff9f0a] flex items-center gap-1 flex-shrink-0">
                      <TrendingUp className="w-3 h-3" />
                      {s.heatScore.toFixed(0)}
                    </div>
                  )}
                </button>
              ))}
              <button
                onClick={() => handleSubmit()}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-all text-left"
              >
                查看全部「{query}」结果
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
