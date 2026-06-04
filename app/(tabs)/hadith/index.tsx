import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../../src/constants/theme';
import { useHadithStore } from '../../../src/store/hadithStore';
import { HadithCollection } from '../../../src/types/hadith';

const COLLECTION_ICONS: Record<string, string> = {
  bukhari: '📗',
  muslim: '📘',
  abudawud: '📙',
  tirmidhi: '📕',
  nasai: '📓',
  ibnmajah: '📔',
};

export default function HadithCollectionListScreen() {
  const { collections } = useHadithStore();

  const renderCollection = ({ item }: { item: HadithCollection }) => (
    <TouchableOpacity
      style={[styles.collectionCard, SHADOWS.card]}
      onPress={() => router.push(`/(tabs)/hadith/collection/${item.name}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{COLLECTION_ICONS[item.name] || '📚'}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.collectionTitle}>{item.title}</Text>
          <Text style={styles.collectionArabic}>{item.titleArabic}</Text>
          <Text style={styles.collectionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.hadithCount}>{item.hadithCount.toLocaleString()}</Text>
        <Text style={styles.hadithLabel}>Hadiths</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={[styles.headerCard, SHADOWS.emerald]}>
        <Text style={styles.headerArabic}>الكتب الستة</Text>
        <Text style={styles.headerTitle}>Kutub al-Sittah</Text>
        <Text style={styles.headerSubtitle}>
          The six most authentic hadith collections with English and Bengali translations
        </Text>
      </View>

      <FlatList
        data={collections}
        renderItem={renderCollection}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerCard: {
    margin: 16,
    padding: 22,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  headerArabic: {
    fontSize: 28,
    color: COLORS.goldGlow,
    fontWeight: '400',
    textShadowColor: 'rgba(251, 191, 36, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '800',
    marginTop: 4,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  collectionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  collectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  collectionArabic: {
    color: COLORS.textSoft,
    fontSize: 14,
    marginTop: 2,
  },
  collectionDescription: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
  },
  hadithCount: {
    color: COLORS.gold,
    fontSize: 16,
    fontWeight: '800',
  },
  hadithLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
