import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTheme } from '../contexts/ThemeContext';
import { fetchSurahList, fetchSurahDetail } from '../services/quranService';
import {
  saveQuranSurahList,
  loadQuranSurahList,
  saveQuranSurahDetail,
  loadQuranSurahDetail,
} from '../utils/storageUtils';
import { QURAN_SURAH_LIST as LOCAL_SURAH_FALLBACK } from '../constants/quranData';

const QuranScreen = () => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [surahList, setSurahList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [selectedSurah, setSelectedSurah] = useState(null);
  const [surahDetail, setSurahDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadSurahList = useCallback(async () => {
    setListError(null);
    setListLoading(true);
    let hasLocalData = false;

    try {
      const cached = await loadQuranSurahList();
      if (cached?.length) {
        setSurahList(cached);
        hasLocalData = true;
      } else if (LOCAL_SURAH_FALLBACK?.length) {
        setSurahList(LOCAL_SURAH_FALLBACK);
        hasLocalData = true;
      }

      const remote = await fetchSurahList();
      if (remote?.length) {
        setSurahList(remote);
        await saveQuranSurahList(remote);
        hasLocalData = true;
      }
    } catch (error) {
      console.error('Error loading Quran list:', error);
      if (!hasLocalData) {
        setListError('Unable to load the Quran right now. Please check your connection.');
      }
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurahList();
  }, [loadSurahList]);

  const filteredSurahs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return surahList;

    return surahList.filter((surah) => {
      const latin = `${surah.name || ''} ${surah.meaning || ''}`.toLowerCase();
      const arabic = surah.arabicName || '';
      return latin.includes(query) || arabic.includes(searchQuery.trim());
    });
  }, [surahList, searchQuery]);

  const handleOpenSurah = useCallback(async (surah) => {
    if (!surah) return;

    setSelectedSurah(surah);
    setSurahDetail(null);
    setDetailError(null);
    setModalVisible(true);
    setDetailLoading(true);

    let hasOffline = false;

    try {
      const cachedDetail = await loadQuranSurahDetail(surah.number);
      if (cachedDetail) {
        setSurahDetail(cachedDetail);
        hasOffline = true;
      } else if (surah.verses?.length) {
        setSurahDetail(surah);
        hasOffline = true;
      }

      const freshDetail = await fetchSurahDetail(surah.number);
      setSurahDetail(freshDetail);
      await saveQuranSurahDetail(surah.number, freshDetail);
    } catch (error) {
      console.error('Error loading surah detail:', error);
      if (!hasOffline) {
        setDetailError('Unable to load this Surah. Please try again when you have an internet connection.');
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleCloseSurah = () => {
    setModalVisible(false);
    setSurahDetail(null);
    setSelectedSurah(null);
    setDetailError(null);
  };

  const renderSurahCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.shadowLight,
        },
      ]}
      onPress={() => handleOpenSurah(item)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.surahNumberWrapper, { borderColor: colors.primary }]}>
          <Text style={[styles.surahNumber, { color: colors.primary }]}>{item.number}</Text>
        </View>
        <View style={styles.cardTitleGroup}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.meaning}</Text>
          <Text style={[styles.cardMeta, { color: colors.textLight }]}>
            {item.revelationPlace}
            {item.versesCount ? ` • ${item.versesCount} verses` : ''}
          </Text>
        </View>
        <Text style={[styles.cardArabic, { color: colors.primaryDark }]}>{item.arabicName}</Text>
      </View>
      {!!item.description && (
        <Text style={[styles.cardDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Quran" subtitle="Browse and read all 114 surahs" />

      <View style={styles.content}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              shadowColor: colors.shadowLight,
            },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textLight} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, meaning, or number"
            placeholderTextColor={colors.textLight}
            style={[styles.searchInput, { color: colors.text }]}
            keyboardType="default"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {listLoading && !surahList.length ? (
          <LoadingSpinner message="Downloading Quran..." />
        ) : (
          <FlatList
            data={filteredSurahs}
            keyExtractor={(item) => item.number?.toString() || item.name}
            renderItem={renderSurahCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="book" size={32} color={colors.textLight} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No matching surah</Text>
                <Text style={[styles.emptyText, { color: colors.textLight }]}>Try a different search term.</Text>
              </View>
            }
          />
        )}

        {listError && !surahList.length && (
          <View style={[styles.errorBanner, { borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{listError}</Text>
          </View>
        )}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={handleCloseSurah}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}> 
            {selectedSurah && (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedSurah.name}</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      {selectedSurah.meaning} • {selectedSurah.revelationPlace} • {selectedSurah.versesCount} verses
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleCloseSurah}>
                    <Ionicons name="close" size={26} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {detailLoading && (
                  <View style={styles.detailLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.detailLoadingText, { color: colors.textSecondary }]}>
                      {surahDetail ? 'Refreshing verses…' : 'Loading surah…'}
                    </Text>
                  </View>
                )}

                {detailError && !surahDetail && (
                  <View style={styles.detailError}>
                    <Text style={[styles.detailErrorText, { color: colors.error }]}>{detailError}</Text>
                  </View>
                )}

                {surahDetail && (
                  <ScrollView style={styles.versesScroll} showsVerticalScrollIndicator={false}>
                    {surahDetail.preBismillah && (
                      <View style={[styles.bismillahContainer, { backgroundColor: colors.primaryLight }]}> 
                        <Text style={[styles.bismillahArabic, { color: colors.primaryDark }]}>{surahDetail.preBismillah.arabic}</Text>
                        {!!surahDetail.preBismillah.transliteration && (
                          <Text style={[styles.bismillahTransliteration, { color: colors.textSecondary }]}>
                            {surahDetail.preBismillah.transliteration}
                          </Text>
                        )}
                        {!!surahDetail.preBismillah.translation && (
                          <Text style={[styles.bismillahTranslation, { color: colors.textSecondary }]}>
                            {surahDetail.preBismillah.translation}
                          </Text>
                        )}
                      </View>
                    )}

                    {surahDetail.verses?.map((verse) => (
                      <View key={`${surahDetail.number}-${verse.number}`} style={[styles.verseRow, { borderBottomColor: colors.border }]}> 
                        <View style={[styles.verseBadge, { borderColor: colors.primary }]}> 
                          <Text style={[styles.verseBadgeText, { color: colors.primary }]}>{verse.number}</Text>
                        </View>
                        <View style={styles.verseContent}>
                          <Text style={[styles.verseArabic, { color: colors.text }]}>{verse.arabic}</Text>
                          {!!verse.transliteration && (
                            <Text style={[styles.verseTransliteration, { color: colors.textSecondary }]}>
                              {verse.transliteration}
                            </Text>
                          )}
                          {!!verse.translation && (
                            <Text style={[styles.verseTranslation, { color: colors.textSecondary }]}>
                              {verse.translation}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  surahNumberWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  surahNumber: {
    fontWeight: '600',
    fontSize: 16,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  cardMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  cardArabic: {
    fontSize: 22,
    marginLeft: 8,
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  errorBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  detailLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLoadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  detailError: {
    paddingVertical: 8,
  },
  detailErrorText: {
    fontSize: 14,
  },
  versesScroll: {
    marginTop: 8,
  },
  bismillahContainer: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  bismillahArabic: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  bismillahTransliteration: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },
  bismillahTranslation: {
    fontSize: 14,
    textAlign: 'center',
  },
  verseRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  verseBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
  },
  verseBadgeText: {
    fontWeight: '600',
  },
  verseContent: {
    flex: 1,
  },
  verseArabic: {
    fontSize: 22,
    textAlign: 'right',
    lineHeight: 32,
  },
  verseTransliteration: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  verseTranslation: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
});

export default QuranScreen;
