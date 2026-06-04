import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
import { searchQuran } from '../../../src/services/quranApi';
import { Ayah } from '../../../src/types/quran';

export default function QuranSearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { results: data, totalCount: count } = await searchQuran(query);
      setResults(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }: { item: Ayah }) => (
    <TouchableOpacity
      style={[styles.resultCard, SHADOWS.card]}
      onPress={() => router.push(`/(tabs)/quran/surah/${item.surahId}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.resultHeader}>
        <View style={styles.verseTag}>
          <Text style={styles.verseTagText}>{item.surahId}:{item.ayahNumber}</Text>
        </View>
      </View>
      {item.arabic ? (
        <Text style={styles.arabicPreview} numberOfLines={2}>{item.arabic}</Text>
      ) : null}
      <Text style={styles.translationPreview} numberOfLines={3}>{item.english}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search verses by keyword..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={styles.statusText}>Searching...</Text>
        </View>
      ) : searched && results.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.statusText}>No results found for "{query}"</Text>
        </View>
      ) : (
        <>
          {totalCount > 0 && (
            <Text style={styles.resultsCount}>{totalCount} results found</Text>
          )}
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item, idx) => `${item.surahId}-${item.ayahNumber}-${idx}`}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: COLORS.border, gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  searchBtn: { backgroundColor: COLORS.gold, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  statusText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
  resultsCount: { color: COLORS.textSoft, fontSize: 12, fontWeight: '600', paddingHorizontal: 18, paddingBottom: 8 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  resultCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultHeader: { flexDirection: 'row', marginBottom: 8 },
  verseTag: { backgroundColor: 'rgba(16, 185, 129, 0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verseTagText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  arabicPreview: { color: COLORS.text, fontSize: 20, textAlign: 'right', marginBottom: 8, lineHeight: 36 },
  translationPreview: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20 },
});

