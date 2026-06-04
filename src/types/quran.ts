// Core Quran data models

export interface Surah {
  id: number;
  name: string;           // Arabic name
  englishName: string;
  banglaName: string;
  ayahCount: number;
  revelationType: 'meccan' | 'medinan';
}

export interface Ayah {
  id: number;
  surahId: number;
  ayahNumber: number;
  arabic: string;
  english: string;
  bangla: string;
  audioUrl: string;
  juzNumber: number;
}

export interface QuranBookmark {
  ayahId: number;
  surahId: number;
  ayahNumber: number;
  surahName: string;
  timestamp: number;
  note?: string;
}

export interface ReadingProgress {
  surahId: number;
  lastAyah: number;
  lastReadAt: number;
}

export interface QuranReaderSettings {
  fontSize: 'small' | 'medium' | 'large';
  translationLanguage: 'english' | 'bangla' | 'both';
  showArabic: boolean;
  showTranslation: boolean;
}

// API response types (quran.com API v4)
export interface QuranApiChapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

export interface QuranApiVerse {
  id: number;
  verse_number: number;
  verse_key: string;
  juz_number: number;
  hizb_number: number;
  rub_el_hizb_number: number;
  text_uthmani: string;
  chapter_id: number;
  translations?: Array<{
    id: number;
    resource_id: number;
    text: string;
    language_name: string;
  }>;
}

export interface TafsirSource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}
