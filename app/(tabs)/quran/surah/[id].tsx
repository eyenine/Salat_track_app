import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Share, Animated
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { COLORS, SHADOWS } from '../../../../src/constants/theme';
import { fetchSurahVerses, fetchSurah } from '../../../../src/services/quranApi';
import { useQuranStore } from '../../../../src/store/quranStore';
import { Ayah, Surah } from '../../../../src/types/quran';

export default function SurahReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const surahId = parseInt(id || '1', 10);

  const { readerSettings, bookmarks, addBookmark, removeBookmark } = useQuranStore();
  const [surah, setSurah] = useState<Surah | null>(null);
  const [verses, setVerses] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const versesRef = useRef<Ayah[]>([]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  // Audio State
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAyahId, setPlayingAyahId] = useState<number | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  useEffect(() => {
    loadSurah();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [surahId]);

  const loadSurah = async () => {
    setLoading(true);
    setError(null);
    try {
      const [surahData, versesData] = await Promise.all([
        fetchSurah(surahId),
        fetchSurahVerses(surahId, readerSettings.translationLanguage),
      ]);
      setSurah(surahData);
      setVerses(versesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load surah');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (ayah: Ayah) => {
    const isMarked = bookmarks.some(b => b.ayahId === ayah.id);
    if (isMarked) {
      removeBookmark(ayah.id);
    } else {
      addBookmark({
        ayahId: ayah.id,
        surahId: ayah.surahId,
        ayahNumber: ayah.ayahNumber,
        surahName: surah?.englishName || '',
        timestamp: Date.now(),
      });
    }
  };

  const handleShare = async (ayah: Ayah) => {
    try {
      await Share.share({
        message: `${ayah.arabic}\n\n${ayah.english}\n\n— Quran ${surah?.englishName} (${surahId}:${ayah.ayahNumber})`,
      });
    } catch (err) {
      // ignore
    }
  };

  const scrollToIndex = (ayahId: number) => {
    const idx = versesRef.current.findIndex(v => v.id === ayahId);
    if (idx !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.3
        });
      } catch (err) {
        // ignore
      }
    }
  };

  const playAudio = async (ayah: Ayah) => {
    try {
      setIsAudioLoading(true);
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: ayah.audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setPlayingAyahId(ayah.id);
      scrollToIndex(ayah.id);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAyahId(null);
          
          const currentVerses = versesRef.current;
          const currentIndex = currentVerses.findIndex(v => v.id === ayah.id);
          if (currentIndex !== -1 && currentIndex < currentVerses.length - 1) {
            const nextAyah = currentVerses[currentIndex + 1];
            // Play next ayah with a slight delay
            setTimeout(() => {
              playAudio(nextAyah);
            }, 800);
          }
        }
      });
    } catch (err) {
      console.error('Audio playback failed', err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setPlayingAyahId(null);
    }
  };

  const getFontSize = () => {
    switch (readerSettings.fontSize) {
      case 'small': return { arabic: 22, translation: 13 };
      case 'large': return { arabic: 32, translation: 17 };
      default: return { arabic: 26, translation: 15 };
    }
  };

  const fontSize = getFontSize();

  const renderAyah = ({ item }: { item: Ayah }) => {
    const isMarked = bookmarks.some(b => b.ayahId === item.id);
    const isPlaying = playingAyahId === item.id;

    return (
      <View style={[styles.ayahCard, SHADOWS.card, isPlaying && styles.ayahCardPlaying]}>
        {/* Ayah Number + Actions Row */}
        <View style={styles.ayahHeader}>
          <View style={styles.ayahNumberBox}>
            <Text style={styles.ayahNumberText}>{item.ayahNumber}</Text>
          </View>
          <View style={styles.ayahActions}>
            <TouchableOpacity 
              onPress={() => isPlaying ? stopAudio() : playAudio(item)} 
              style={styles.actionBtn}
              disabled={isAudioLoading && !isPlaying}
            >
              {isAudioLoading && isPlaying ? (
                <ActivityIndicator size="small" color={COLORS.gold} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'stop-circle' : 'play-circle-outline'}
                  size={20}
                  color={isPlaying ? COLORS.gold : COLORS.textMuted}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleBookmark(item)} style={styles.actionBtn}>
              <Ionicons
                name={isMarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isMarked ? COLORS.gold : COLORS.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionBtn}>
              <Ionicons name="share-outline" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arabic Text */}
        {readerSettings.showArabic && (
          <Text style={[styles.arabicText, { fontSize: fontSize.arabic }]}>
            {item.arabic}
          </Text>
        )}

        {/* Translation */}
        {readerSettings.showTranslation && (
          <View style={styles.translationContainer}>
            {(readerSettings.translationLanguage === 'english' || readerSettings.translationLanguage === 'both') && item.english ? (
              <Text style={[styles.translationText, { fontSize: fontSize.translation }]}>
                {item.english}
              </Text>
            ) : null}
            {(readerSettings.translationLanguage === 'bangla' || readerSettings.translationLanguage === 'both') && item.bangla ? (
              <Text style={[styles.translationText, styles.banglaText, { fontSize: fontSize.translation }]}>
                {item.bangla}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Loading Surah...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.STATUS.MISSED} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadSurah}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: surah ? `${surah.englishName}` : 'Surah',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={{ padding: 4 }}>
                <Ionicons name="settings-outline" size={20} color={COLORS.gold} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        {/* Surah Header */}
        {surah && (
          <View style={[styles.surahHeader, SHADOWS.emerald]}>
            <Text style={styles.surahArabicTitle}>{surah.name}</Text>
            <Text style={styles.surahEnglishTitle}>{surah.englishName}</Text>
            <Text style={styles.surahMeta}>
              {surah.revelationType === 'meccan' ? 'Meccan' : 'Medinan'} • {surah.ayahCount} Ayahs
            </Text>
            {/* Bismillah */}
            {surahId !== 1 && surahId !== 9 && (
              <Text style={styles.bismillah}>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</Text>
            )}
          </View>
        )}

        {/* Verses List */}
        <FlatList
          ref={flatListRef}
          data={verses}
          renderItem={renderAyah}
          keyExtractor={(item) => `${item.surahId}-${item.ayahNumber}`}
          contentContainerStyle={styles.versesList}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: info.index * info.averageItemLength,
              animated: true,
            });
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.STATUS.MISSED,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
  },
  retryText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  surahHeader: {
    margin: 16,
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  surahArabicTitle: {
    fontSize: 32,
    color: COLORS.goldGlow,
    fontWeight: '400',
    textShadowColor: 'rgba(251, 191, 36, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  surahEnglishTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 4,
  },
  surahMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  bismillah: {
    fontSize: 24,
    color: COLORS.textSoft,
    marginTop: 16,
    textAlign: 'center',
  },
  versesList: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  ayahCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ayahCardPlaying: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(24, 32, 42, 0.6)',
  },
  ayahHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ayahNumberBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahNumberText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  ayahActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  actionBtn: {
    padding: 4,
  },
  arabicText: {
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 48,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  translationContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  translationText: {
    color: COLORS.textMuted,
    lineHeight: 24,
    fontWeight: '400',
  },
  banglaText: {
    marginTop: 8,
    color: 'rgba(167, 243, 208, 0.7)',
  },
});
