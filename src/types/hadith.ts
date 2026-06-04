// Core Hadith data models

export interface HadithCollection {
  name: string;          // API key (e.g., 'bukhari')
  title: string;         // Display name (e.g., 'Sahih al-Bukhari')
  titleArabic: string;   // Arabic name
  hadithCount: number;
  description: string;
}

export interface HadithSection {
  name: string;
  hadithStartNumber: number;
  hadithEndNumber: number;
  numberOfHadith: number;
}

export interface Hadith {
  number: number;
  arab: string;          // Arabic text
  english: string;       // English translation  
  bengali: string;       // Bengali translation
  collectionName: string;
  grade?: string;        // Sahih, Hasan, Da'if, etc.
}

export interface HadithBookmark {
  hadithNumber: number;
  collectionName: string;
  timestamp: number;
  note?: string;
}

// The six major hadith collections
export const HADITH_COLLECTIONS: HadithCollection[] = [
  {
    name: 'bukhari',
    title: 'Sahih al-Bukhari',
    titleArabic: 'صحيح البخاري',
    hadithCount: 7563,
    description: 'Compiled by Imam al-Bukhari. The most authentic collection.',
  },
  {
    name: 'muslim',
    title: 'Sahih Muslim',
    titleArabic: 'صحيح مسلم',
    hadithCount: 7563,
    description: 'Compiled by Imam Muslim. Second most authentic collection.',
  },
  {
    name: 'abudawud',
    title: 'Sunan Abu Dawud',
    titleArabic: 'سنن أبي داود',
    hadithCount: 5274,
    description: 'Compiled by Imam Abu Dawud. Focuses on legal hadiths.',
  },
  {
    name: 'tirmidhi',
    title: 'Jami at-Tirmidhi',
    titleArabic: 'جامع الترمذي',
    hadithCount: 3956,
    description: 'Compiled by Imam at-Tirmidhi. Includes grading of each hadith.',
  },
  {
    name: 'nasai',
    title: "Sunan an-Nasa'i",
    titleArabic: 'سنن النسائي',
    hadithCount: 5758,
    description: "Compiled by Imam an-Nasa'i. Known for strict authentication.",
  },
  {
    name: 'ibnmajah',
    title: 'Sunan Ibn Majah',
    titleArabic: 'سنن ابن ماجه',
    hadithCount: 4341,
    description: 'Compiled by Imam Ibn Majah. The sixth canonical collection.',
  },
];
