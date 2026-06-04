import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Hadith, HadithCollection, HadithBookmark, HADITH_COLLECTIONS } from '../types/hadith';

interface HadithStoreState {
  // Collections
  collections: HadithCollection[];

  // Current view
  currentCollection: HadithCollection | null;
  setCurrentCollection: (collection: HadithCollection | null) => void;

  // Hadiths list
  hadiths: Hadith[];
  setHadiths: (hadiths: Hadith[]) => void;
  hadithsLoading: boolean;
  setHadithsLoading: (loading: boolean) => void;

  // Bookmarks
  bookmarks: HadithBookmark[];
  addBookmark: (bookmark: HadithBookmark) => void;
  removeBookmark: (hadithNumber: number, collectionName: string) => void;
  isBookmarked: (hadithNumber: number, collectionName: string) => boolean;

  // Current page for pagination
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export const useHadithStore = create<HadithStoreState>()(
  persist(
    (set, get) => ({
      // Collections (static data)
      collections: HADITH_COLLECTIONS,

      // Current view
      currentCollection: null,
      setCurrentCollection: (currentCollection) => set({ currentCollection, hadiths: [], currentPage: 1 }),

      // Hadiths list
      hadiths: [],
      setHadiths: (hadiths) => set({ hadiths }),
      hadithsLoading: false,
      setHadithsLoading: (hadithsLoading) => set({ hadithsLoading }),

      // Bookmarks
      bookmarks: [],
      addBookmark: (bookmark) =>
        set((state) => ({ bookmarks: [...state.bookmarks, bookmark] })),
      removeBookmark: (hadithNumber, collectionName) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(
            (b) => !(b.hadithNumber === hadithNumber && b.collectionName === collectionName)
          ),
        })),
      isBookmarked: (hadithNumber, collectionName) =>
        get().bookmarks.some(
          (b) => b.hadithNumber === hadithNumber && b.collectionName === collectionName
        ),

      // Pagination
      currentPage: 1,
      setCurrentPage: (currentPage) => set({ currentPage }),
    }),
    {
      name: 'hadith-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        bookmarks: state.bookmarks,
      }),
    }
  )
);
