import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surah, Ayah, QuranBookmark, QuranReaderSettings } from '../types/quran';

interface QuranStoreState {
  // Surah list
  surahs: Surah[];
  setSurahs: (surahs: Surah[]) => void;
  surahsLoading: boolean;
  setSurahsLoading: (loading: boolean) => void;

  // Current surah / verses
  currentSurah: Surah | null;
  setCurrentSurah: (surah: Surah | null) => void;
  currentVerses: Ayah[];
  setCurrentVerses: (verses: Ayah[]) => void;
  versesLoading: boolean;
  setVersesLoading: (loading: boolean) => void;

  // Bookmarks
  bookmarks: QuranBookmark[];
  addBookmark: (bookmark: QuranBookmark) => void;
  removeBookmark: (ayahId: number) => void;
  isBookmarked: (ayahId: number) => boolean;

  // Reader settings
  readerSettings: QuranReaderSettings;
  updateReaderSettings: (settings: Partial<QuranReaderSettings>) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Ayah[];
  setSearchResults: (results: Ayah[]) => void;
  searchLoading: boolean;
  setSearchLoading: (loading: boolean) => void;
}

export const useQuranStore = create<QuranStoreState>()(
  persist(
    (set, get) => ({
      // Surah list
      surahs: [],
      setSurahs: (surahs) => set({ surahs }),
      surahsLoading: false,
      setSurahsLoading: (surahsLoading) => set({ surahsLoading }),

      // Current surah / verses
      currentSurah: null,
      setCurrentSurah: (currentSurah) => set({ currentSurah }),
      currentVerses: [],
      setCurrentVerses: (currentVerses) => set({ currentVerses }),
      versesLoading: false,
      setVersesLoading: (versesLoading) => set({ versesLoading }),

      // Bookmarks
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark],
        })),
      removeBookmark: (ayahId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.ayahId !== ayahId),
        })),
      isBookmarked: (ayahId) => get().bookmarks.some((b) => b.ayahId === ayahId),

      // Reader settings
      readerSettings: {
        fontSize: 'medium',
        translationLanguage: 'both',
        showArabic: true,
        showTranslation: true,
      },
      updateReaderSettings: (settings) =>
        set((state) => ({
          readerSettings: { ...state.readerSettings, ...settings },
        })),

      // Search
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      searchResults: [],
      setSearchResults: (searchResults) => set({ searchResults }),
      searchLoading: false,
      setSearchLoading: (searchLoading) => set({ searchLoading }),
    }),
    {
      name: 'quran-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        readerSettings: state.readerSettings,
      }),
    }
  )
);
