/**
 * Store — Bible Navigation State (Zustand)
 */

import { create } from 'zustand';

interface BibleState {
  selectedBook: string | null;
  selectedChapter: number | null;
  searchQuery: string;
  isLoading: boolean;

  selectBook: (bookId: string) => void;
  selectChapter: (chapter: number) => void;
  setSearchQuery: (query: string) => void;
  clearSelection: () => void;
  setLoading: (loading: boolean) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  selectedBook: null,
  selectedChapter: null,
  searchQuery: '',
  isLoading: false,

  selectBook: (bookId) => set({ selectedBook: bookId, selectedChapter: null }),
  selectChapter: (chapter) => set({ selectedChapter: chapter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSelection: () => set({ selectedBook: null, selectedChapter: null, searchQuery: '' }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
