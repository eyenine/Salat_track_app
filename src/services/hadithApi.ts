import { Hadith, HadithSection } from '../types/hadith';

// ==================== API Configuration ====================
// Using fawazahmed0/hadith-api (free, no auth required, supports multiple languages)
const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1';
const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;

// ==================== API Client ====================

async function apiRequest<T>(url: string, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  throw new Error('Failed after all retries');
}

// ==================== Public API Functions ====================

/**
 * Fetch sections (chapters/books) for a collection
 */
export async function fetchCollectionSections(
  collectionName: string
): Promise<HadithSection[]> {
  try {
    const response = await apiRequest<{
      metadata: {
        name: string;
        sections: Record<string, string>;
        section_details: Record<string, {
          hadiths_start_number: number;
          hadiths_end_number: number;
          number_of_hadiths: number;
        }>;
      };
    }>(`${API_BASE}/info/${collectionName}.json`);

    const sections: HadithSection[] = [];
    const details = response.metadata.section_details;
    const names = response.metadata.sections;

    for (const [key, detail] of Object.entries(details)) {
      sections.push({
        name: names[key] || `Section ${key}`,
        hadithStartNumber: detail.hadiths_start_number,
        hadithEndNumber: detail.hadiths_end_number,
        numberOfHadith: detail.number_of_hadiths,
      });
    }

    return sections;
  } catch (error) {
    console.error(`Error fetching sections for ${collectionName}:`, error);
    throw new Error('Failed to fetch sections.');
  }
}

/**
 * Fetch hadiths from a collection by range
 */
export async function fetchHadiths(
  collectionName: string,
  start: number = 1,
  limit: number = 20
): Promise<Hadith[]> {
  try {
    // Fetch English, Arabic, and Bengali in parallel
    const [enResponse, arResponse, bnResponse] = await Promise.allSettled([
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string; grades?: Array<{ grade: string }> }> }>(
        `${API_BASE}/editions/eng-${collectionName}.json`
      ),
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string }> }>(
        `${API_BASE}/editions/ara-${collectionName}.json`
      ),
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string }> }>(
        `${API_BASE}/editions/ben-${collectionName}.json`
      ),
    ]);

    const enHadiths = enResponse.status === 'fulfilled' ? enResponse.value.hadiths : [];
    const arHadiths = arResponse.status === 'fulfilled' ? arResponse.value.hadiths : [];
    const bnHadiths = bnResponse.status === 'fulfilled' ? bnResponse.value.hadiths : [];

    // Build a map by hadith number
    const hadithMap = new Map<number, Hadith>();

    for (const h of enHadiths) {
      if (h.hadithnumber >= start && h.hadithnumber < start + limit) {
        hadithMap.set(h.hadithnumber, {
          number: h.hadithnumber,
          arab: '',
          english: h.text || '',
          bengali: '',
          collectionName,
          grade: h.grades?.[0]?.grade,
        });
      }
    }

    for (const h of arHadiths) {
      if (hadithMap.has(h.hadithnumber)) {
        hadithMap.get(h.hadithnumber)!.arab = h.text || '';
      }
    }

    for (const h of bnHadiths) {
      if (hadithMap.has(h.hadithnumber)) {
        hadithMap.get(h.hadithnumber)!.bengali = h.text || '';
      }
    }

    return Array.from(hadithMap.values()).sort((a, b) => a.number - b.number);
  } catch (error) {
    console.error(`Error fetching hadiths from ${collectionName}:`, error);
    throw new Error('Failed to fetch hadiths.');
  }
}

/**
 * Fetch a single hadith by number
 */
export async function fetchSingleHadith(
  collectionName: string,
  hadithNumber: number
): Promise<Hadith | null> {
  try {
    const [enResponse, arResponse, bnResponse] = await Promise.allSettled([
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string; grades?: Array<{ grade: string }> }> }>(
        `${API_BASE}/editions/eng-${collectionName}.json`
      ),
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string }> }>(
        `${API_BASE}/editions/ara-${collectionName}.json`
      ),
      apiRequest<{ hadiths: Array<{ hadithnumber: number; text: string }> }>(
        `${API_BASE}/editions/ben-${collectionName}.json`
      ),
    ]);

    const enHadith = enResponse.status === 'fulfilled'
      ? enResponse.value.hadiths.find(h => h.hadithnumber === hadithNumber)
      : null;
    const arHadith = arResponse.status === 'fulfilled'
      ? arResponse.value.hadiths.find(h => h.hadithnumber === hadithNumber)
      : null;
    const bnHadith = bnResponse.status === 'fulfilled'
      ? bnResponse.value.hadiths.find(h => h.hadithnumber === hadithNumber)
      : null;

    if (!enHadith && !arHadith) return null;

    return {
      number: hadithNumber,
      arab: arHadith?.text || '',
      english: enHadith?.text || '',
      bengali: bnHadith?.text || '',
      collectionName,
      grade: enHadith?.grades?.[0]?.grade,
    };
  } catch (error) {
    console.error(`Error fetching hadith ${hadithNumber}:`, error);
    return null;
  }
}

/**
 * Get a random hadith from a collection
 */
export async function fetchRandomHadith(
  collectionName: string = 'bukhari'
): Promise<Hadith | null> {
  try {
    const response = await apiRequest<{
      hadiths: Array<{ hadithnumber: number; text: string; grades?: Array<{ grade: string }> }>;
    }>(`${API_BASE}/editions/eng-${collectionName}.json`);

    if (!response.hadiths || response.hadiths.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * response.hadiths.length);
    const h = response.hadiths[randomIndex];

    return {
      number: h.hadithnumber,
      arab: '',
      english: h.text || '',
      bengali: '',
      collectionName,
      grade: h.grades?.[0]?.grade,
    };
  } catch (error) {
    console.error('Error fetching random hadith:', error);
    return null;
  }
}
