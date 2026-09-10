'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { MaterialItem } from './types';
import { CATEGORIES } from './constants';

interface MaterialsFilterBarProps {
  materials: MaterialItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLevel: string;
  onSelectLevel: (level: string) => void;
}

export default function MaterialsFilterBar({
  materials,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedLevel,
  onSelectLevel,
}: MaterialsFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
        Category:
      </span>
      <div className="w-full sm:w-64">
        <select
          value={selectedCategory}
          onChange={(e) => onSelectCategory(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-card/60 text-foreground border border-border text-xs font-bold transition-all focus:outline-none focus:border-primary"
        >
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? materials.length
                : materials.filter((m) => m.category === cat.id).length;

            return (
              <option key={cat.id} value={cat.id}>
                {cat.label} ({count})
              </option>
            );
          })}
        </select>
      </div>

      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
        Search:
      </span>
      <div className="relative w-full sm:w-80">
        <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search materials by title or keyword..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary transition-colors text-foreground"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Target Level:
          </span>
          <select
            value={selectedLevel}
            onChange={(e) => onSelectLevel(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold focus:outline-none focus:border-primary text-foreground"
          >
            <option value="ALL">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );
}
