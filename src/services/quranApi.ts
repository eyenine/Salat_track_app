import {
  Surah,
  Ayah,
  QuranApiChapter,
  QuranApiVerse,
  TafsirSource,
} from '../types/quran';

// ==================== API Configuration ====================
const API_BASE_URL = 'https://api.quran.com/api/v4';
const AUDIO_BASE_URL = 'https://verses.quran.com';
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;

// Translation IDs for different languages
const TRANSLATION_IDS = {
  english: 20,  // Sahih International
  bangla: 161,  // Muhiuddin Khan
} as const;

// Reciter ID for audio
const RECITER_ID = 7; // Mishary Rashid Alafasy

// ==================== API Client ====================

async function apiRequest<T>(endpoint: string, retries = MAX_RETRIES): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error('Failed after all retries');
}

// ==================== Transform Functions ====================

function transformChapterToSurah(chapter: QuranApiChapter): Surah {
  return {
    id: chapter.id,
    name: chapter.name_arabic,
    englishName: chapter.name_simple,
    banglaName: chapter.translated_name?.name || chapter.name_simple,
    ayahCount: chapter.verses_count,
    revelationType: chapter.revelation_place === 'makkah' ? 'meccan' : 'medinan',
  };
}

function transformVerseToAyah(verse: QuranApiVerse): Ayah {
  const englishTranslation = verse.translations?.find(
    t => t.resource_id === TRANSLATION_IDS.english
  );
  const banglaTranslation = verse.translations?.find(
    t => t.resource_id === TRANSLATION_IDS.bangla
  );

  // Clean HTML tags from translation text
  const cleanText = (text: string) => text?.replace(/<[^>]*>/g, '') || '';

  return {
    id: verse.id,
    surahId: verse.chapter_id,
    ayahNumber: verse.verse_number,
    arabic: verse.text_uthmani,
    english: cleanText(englishTranslation?.text || ''),
    bangla: cleanText(banglaTranslation?.text || ''),
    audioUrl: `${AUDIO_BASE_URL}/Alafasy/mp3/${verse.verse_key.replace(':', '')}.mp3`,
    juzNumber: verse.juz_number,
  };
}

// ==================== Public API Functions ====================

/**
 * Fetch all 114 Surahs
 */
export async function fetchSurahs(): Promise<Surah[]> {
  try {
    const response = await apiRequest<{ chapters: QuranApiChapter[] }>('/chapters');
    return response.chapters.map(transformChapterToSurah);
  } catch (error) {
    console.error('Error fetching Surahs:', error);
    throw new Error('Failed to fetch Surahs. Please check your internet connection.');
  }
}

/**
 * Fetch a specific Surah by ID
 */
export async function fetchSurah(surahId: number): Promise<Surah | null> {
  try {
    const response = await apiRequest<{ chapter: QuranApiChapter }>(`/chapters/${surahId}`);
    return transformChapterToSurah(response.chapter);
  } catch (error) {
    console.error(`Error fetching Surah ${surahId}:`, error);
    return null;
  }
}

/**
 * Fetch all verses for a Surah with translations
 */
export async function fetchSurahVerses(
  surahId: number,
  language: 'english' | 'bangla' | 'both' = 'both'
): Promise<Ayah[]> {
  try {
    let translationIds: number[];
    switch (language) {
      case 'english':
        translationIds = [TRANSLATION_IDS.english];
        break;
      case 'bangla':
        translationIds = [TRANSLATION_IDS.bangla];
        break;
      case 'both':
      default:
        translationIds = [TRANSLATION_IDS.english, TRANSLATION_IDS.bangla];
    }

    const endpoint = `/verses/by_chapter/${surahId}?translations=${translationIds.join(',')}&fields=text_uthmani,chapter_id,verse_number,juz_number&per_page=300`;
    const response = await apiRequest<{ verses: QuranApiVerse[] }>(endpoint);

    return response.verses.map(transformVerseToAyah);
  } catch (error) {
    console.error(`Error fetching verses for Surah ${surahId}:`, error);
    throw new Error('Failed to fetch verses. Please check your internet connection.');
  }
}

/**
 * Search the Quran by keyword
 */
export async function searchQuran(
  query: string,
  language: 'en' | 'bn' = 'en'
): Promise<{ results: Ayah[]; totalCount: number }> {
  try {
    const translationId = language === 'bn' ? TRANSLATION_IDS.bangla : TRANSLATION_IDS.english;
    const endpoint = `/search?q=${encodeURIComponent(query)}&size=20&language=${language}`;
    const response = await apiRequest<{
      search: {
        total_results: number;
        results: Array<{
          verse_key: string;
          verse_id: number;
          text: string;
          translations: Array<{ text: string; resource_id: number }>;
        }>;
      };
    }>(endpoint);

    const results: Ayah[] = response.search.results.map((r, idx) => {
      const [surahId, ayahNumber] = r.verse_key.split(':').map(Number);
      return {
        id: r.verse_id || idx,
        surahId,
        ayahNumber,
        arabic: r.text || '',
        english: r.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || '',
        bangla: '',
        audioUrl: `${AUDIO_BASE_URL}/Alafasy/mp3/${r.verse_key.replace(':', '')}.mp3`,
        juzNumber: 0,
      };
    });

    return { results, totalCount: response.search.total_results };
  } catch (error) {
    console.error('Error searching Quran:', error);
    throw new Error('Search failed. Please try again.');
  }
}

/**
 * Get available Tafsir sources
 */
export async function fetchTafsirSources(language: string = 'en'): Promise<TafsirSource[]> {
  try {
    const response = await apiRequest<{
      tafsirs: Array<{
        id: number;
        name: string;
        author_name: string;
        language_name: string;
      }>;
    }>(`/resources/tafsirs?language=${language}`);

    return response.tafsirs.map(t => ({
      id: t.id,
      name: t.name,
      author_name: t.author_name,
      language_name: t.language_name,
    }));
  } catch (error) {
    console.error('Error fetching Tafsir sources:', error);
    return [];
  }
}

/**
 * Get Tafsir for a specific verse
 */
export async function fetchTafsir(
  tafsirId: number,
  verseKey: string
): Promise<string> {
  try {
    const response = await apiRequest<{
      tafsir: {
        text: string;
      };
    }>(`/tafsirs/${tafsirId}/by_ayah/${verseKey}`);

    return response.tafsir.text?.replace(/<[^>]*>/g, '') || 'No tafsir available.';
  } catch (error) {
    console.error('Error fetching Tafsir:', error);
    return 'Failed to load tafsir.';
  }
}

/**
 * Get audio recitation URL for a verse
 */
export function getVerseAudioUrl(surahId: number, ayahNumber: number): string {
  const paddedSurah = String(surahId).padStart(3, '0');
  const paddedAyah = String(ayahNumber).padStart(3, '0');
  return `${AUDIO_BASE_URL}/Alafasy/mp3/${paddedSurah}${paddedAyah}.mp3`;
}
