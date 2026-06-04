import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Share
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../../../src/constants/theme';
import { fetchHadiths } from '../../../../src/services/hadithApi';
import { useHadithStore } from '../../../../src/store/hadithStore';
import { Hadith, HADITH_COLLECTIONS } from '../../../../src/types/hadith';

const PAGE_SIZE = 20;

export default function CollectionDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const collectionName = name || 'bukhari';

  const { bookmarks, addBookmark, removeBookmark } = useHadithStore();
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const collection = HADITH_COLLECTIONS.find(c => c.name === collectionName);

  const loadHadiths = useCallback(async (pageNum: number, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const start = (pageNum - 1) * PAGE_SIZE + 1;
      const data = await fetchHadiths(collectionName, start, PAGE_SIZE);
      if (append) {
        setHadiths(prev => [...prev, ...data]);
      } else {
        setHadiths(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hadiths');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [collectionName]);

  useEffect(() => {
    loadHadiths(1);
  }, [loadHadiths]);

  const handleLoadMore = () => {
    if (!loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadHadiths(nextPage, true);
    }
  };

  const toggleBookmark = (hadith: Hadith) => {
    const isMarked = bookmarks.some(
      b => b.hadithNumber === hadith.number && b.collectionName === hadith.collectionName
    );
    if (isMarked) {
      removeBookmark(hadith.number, hadith.collectionName);
    } else {
      addBookmark({
        hadithNumber: hadith.number,
        collectionName: hadith.collectionName,
        timestamp: Date.now(),
      });
    }
  };

  const handleShare = async (hadith: Hadith) => {
    try {
      await Share.share({
        message: `${hadith.arab ? hadith.arab + '\n\n' : ''}${hadith.english}\n\n— ${collection?.title || collectionName}, Hadith #${hadith.number}`,
      });
    } catch (err) { /* ignore */ }
  };

  const renderHadith = ({ item }: { item: Hadith }) => {
    const isMarked = bookmarks.some(
      b => b.hadithNumber === item.number && b.collectionName === item.collectionName
    );

    return (
      <View style={[styles.hadithCard, SHADOWS.card]}>
        {/* Header */}
        <View style={styles.hadithHeader}>
          <View style={styles.hadithNumberBox}>
            <Text style={styles.hadithNumber}>#{item.number}</Text>
          </View>
          {item.grade && (
            <View style={[
              styles.gradeBadge,
              { backgroundColor: item.grade.toLowerCase().includes('sahih')
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(245, 158, 11, 0.08)' 
              },
            ]}>
              <Text style={[
                styles.gradeText,
                { color: item.grade.toLowerCase().includes('sahih')
                  ? COLORS.primary
                  : COLORS.gold 
                },
              ]}>
                {item.grade}
              </Text>
            </View>
          )}
          <View style={styles.hadithActions}>
            <TouchableOpacity onPress={() => toggleBookmark(item)} style={styles.actionBtn}>
              <Ionicons
                name={isMarked ? 'star' : 'star-outline'}
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
        {item.arab ? (
          <Text style={styles.arabicText}>{item.arab}</Text>
        ) : null}

        {/* English Translation */}
        {item.english ? (
          <View style={styles.translationSection}>
            <View style={styles.langTag}>
              <Text style={styles.langTagText}>EN</Text>
            </View>
            <Text style={styles.translationText}>{item.english}</Text>
          </View>
        ) : null}

        {/* Bengali Translation */}
        {item.bengali ? (
          <View style={styles.translationSection}>
            <View style={[styles.langTag, { backgroundColor: 'rgba(167, 243, 208, 0.08)' }]}>
              <Text style={[styles.langTagText, { color: COLORS.textSoft }]}>BN</Text>
            </View>
            <Text style={[styles.translationText, styles.bengaliText]}>{item.bengali}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Loading hadiths...</Text>
      </View>
    );
  }

  if (error && hadiths.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.STATUS.MISSED} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadHadiths(1)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{ title: collection?.title || collectionName }}
      />

      <View style={styles.container}>
        {/* Collection Header */}
        {collection && (
          <View style={[styles.collectionHeader, SHADOWS.emerald]}>
            <Text style={styles.headerArabic}>{collection.titleArabic}</Text>
            <Text style={styles.headerTitle}>{collection.title}</Text>
            <Text style={styles.headerDesc}>{collection.description}</Text>
          </View>
        )}

        <FlatList
          data={hadiths}
          renderItem={renderHadith}
          keyExtractor={(item) => `${item.collectionName}-${item.number}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.gold} />
                <Text style={styles.footerText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, gap: 12 },
  loadingText: { color: COLORS.textSoft, fontSize: 14, fontWeight: '600' },
  errorText: { color: COLORS.STATUS.MISSED, fontSize: 14, fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: COLORS.gold, borderRadius: 10 },
  retryText: { color: '#000', fontSize: 13, fontWeight: '700' },
  collectionHeader: {
    margin: 16, padding: 20, backgroundColor: COLORS.card, borderRadius: 22,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  headerArabic: {
    fontSize: 26, color: COLORS.goldGlow, fontWeight: '400',
    textShadowColor: 'rgba(251, 191, 36, 0.15)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },
  headerTitle: { fontSize: 17, color: COLORS.text, fontWeight: '800', marginTop: 4 },
  headerDesc: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  hadithCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  hadithHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  hadithNumberBox: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  hadithNumber: { color: COLORS.gold, fontSize: 12, fontWeight: '800' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gradeText: { fontSize: 10, fontWeight: '700' },
  hadithActions: { flexDirection: 'row', gap: 10, marginLeft: 'auto' },
  actionBtn: { padding: 4 },
  arabicText: {
    color: COLORS.text, fontSize: 22, textAlign: 'right', lineHeight: 40,
    marginBottom: 12, fontWeight: '400',
  },
  translationSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  langTag: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 6,
  },
  langTagText: { color: COLORS.gold, fontSize: 9, fontWeight: '800' },
  translationText: { color: COLORS.textMuted, fontSize: 14, lineHeight: 22 },
  bengaliText: { color: 'rgba(167, 243, 208, 0.7)' },
  footerLoader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 20, gap: 8 },
  footerText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
});
