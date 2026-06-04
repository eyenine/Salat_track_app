import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
import { fetchSurahs } from '../../../src/services/quranApi';
import { useQuranStore } from '../../../src/store/quranStore';
import { Surah } from '../../../src/types/quran';

export default function QuranSurahListScreen() {
  const { surahs, setSurahs, surahsLoading, setSurahsLoading } = useQuranStore();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (surahs.length === 0) loadSurahs();
  }, []);

  const loadSurahs = async () => {
    setSurahsLoading(true);
    try {
      const data = await fetchSurahs();
      setSurahs(data);
    } catch (error) {
      console.error('Failed to load surahs:', error);
    } finally {
      setSurahsLoading(false);
    }
  };

  const filteredSurahs = surahs.filter(s =>
    s.englishName.toLowerCase().includes(searchText.toLowerCase()) ||
    s.name.includes(searchText) ||
    s.id.toString() === searchText.trim()
  );

  const renderSurah = ({ item }: { item: Surah }) => (
    <TouchableOpacity
      style={[styles.surahCard, SHADOWS.card]}
      onPress={() => router.push(`/(tabs)/quran/surah/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.surahNumberBox}>
        <Text style={styles.surahNumber}>{item.id}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahEnglishName}>{item.englishName}</Text>
        <Text style={styles.surahMeta}>
          {item.revelationType === 'meccan' ? 'Meccan' : 'Medinan'} • {item.ayahCount} Ayahs
        </Text>
      </View>
      <View style={styles.surahArabicBox}>
        <Text style={styles.surahArabicName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  if (surahsLoading && surahs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Loading Surahs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search surah by name or number..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Access Buttons */}
      <View style={styles.quickAccess}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push('/(tabs)/quran/search')}
          activeOpacity={0.7}
        >
          <Ionicons name="search-outline" size={16} color={COLORS.gold} />
          <Text style={styles.quickBtnText}>Search Quran</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => router.push('/(tabs)/quran/bookmarks')}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark-outline" size={16} color={COLORS.gold} />
          <Text style={styles.quickBtnText}>Bookmarks</Text>
        </TouchableOpacity>
      </View>

      {/* Surah List */}
      <FlatList
        data={filteredSurahs}
        renderItem={renderSurah}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchText ? 'No surahs found' : 'Failed to load surahs'}
            </Text>
            {!searchText && (
              <TouchableOpacity style={styles.retryBtn} onPress={loadSurahs}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
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
  },
  loadingText: {
    color: COLORS.textSoft,
    fontSize: 14,
    marginTop: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  quickAccess: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  quickBtnText: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  surahCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  surahNumberBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  surahNumber: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '800',
  },
  surahInfo: {
    flex: 1,
  },
  surahEnglishName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  surahMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  surahArabicBox: {
    paddingLeft: 8,
  },
  surahArabicName: {
    color: COLORS.textSoft,
    fontSize: 20,
    fontWeight: '400',
    fontFamily: undefined, // Will use default; can set Arabic font later
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    marginTop: 8,
  },
  retryText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
});

