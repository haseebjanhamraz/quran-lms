import { MaterialCategory } from './types';

export interface CategoryOption {
  id: 'ALL' | MaterialCategory;
  label: string;
}

export const CATEGORIES: CategoryOption[] = [
  { id: 'ALL', label: 'All Materials' },
  { id: 'QAIDA', label: 'Noorani & Madani Qaida' },
  { id: 'TAJWEED', label: 'Tajweed Rules & Guides' },
  { id: 'QURAN_PARAH', label: 'Quranic Texts & Parahs' },
  { id: 'DUAS_ADHKAR', label: 'Duas & Daily Adhkar' },
  { id: 'ISLAMIC_STUDIES', label: 'Islamic Studies' },
  { id: 'GENERAL', label: 'General Resources' },
];

export const CATEGORY_COLORS: Record<MaterialCategory, string> = {
  QAIDA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TAJWEED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  QURAN_PARAH: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  DUAS_ADHKAR: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  ISLAMIC_STUDIES: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  GENERAL: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};
