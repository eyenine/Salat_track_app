import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
import { useQuranStore } from '../../../src/store/quranStore';
import { QuranBookmark } from '../../../src/types/quran';

export default function QuranBookmarksScreen() {
  const { bookmarks, removeBookmark } = useQuranStore();

  const renderBookmark = ({ item }: { item: QuranBookmark }) => (
    <TouchableOpacity
      style={[styles.bookmarkCard, SHADOWS.card]}
      onPress={() => router.push(`/(tabs)/quran/surah/${item.surahId}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.bookmarkLeft}>
        <View style={styles.iconBox}>
          <Ionicons name="bookmark" size={18} color={COLORS.gold} />
        </View>
        <View>
          <Text style={styles.surahName}>{item.surahName}</Text>
          <Text style={styles.verseRef}>Verse {item.ayahNumber}</Text>
          <Text style={styles.dateText}>
            {new Date(item.timestamp).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeBookmark(item.ayahId)}
      >
        <Ionicons name="trash-outline" size={16} color={COLORS.STATUS.MISSED} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bookmark icon while reading a surah to save verses here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={[...bookmarks].sort((a, b) => b.timestamp - a.timestamp)}
          renderItem={renderBookmark}
          keyExtractor={(item) => `${item.surahId}-${item.ayahNumber}-${item.timestamp}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  emptySubtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  bookmarkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  bookmarkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  surahName: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  verseRef: { color: COLORS.textSoft, fontSize: 12, fontWeight: '500', marginTop: 1 },
  dateText: { color: COLORS.textMuted, fontSize: 10, fontWeight: '500', marginTop: 2 },
  removeBtn: {
    padding: 8, borderRadius: 10, backgroundColor: 'rgba(244, 63, 94, 0.06)',
  },
});

