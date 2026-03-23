import { QURAN_API_CONFIG } from '../constants/config';

const { BASE_URL, TIMEOUT } = QURAN_API_CONFIG;

const fetchJson = async (endpoint, options = {}) => {
  const controller = new AbortController();
  const timeout = options.timeout || TIMEOUT;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Quran API responded with ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const mapSurahSummary = (surah) => ({
  number: surah?.number,
  name: surah?.name?.transliteration?.en || surah?.name?.translation?.en || `Surah ${surah?.number}`,
  arabicName: surah?.name?.short || surah?.name?.long || '',
  meaning: surah?.name?.translation?.en || '',
  revelationPlace: surah?.revelation?.en || '',
  versesCount: surah?.numberOfVerses || 0,
  description: surah?.tafsir?.id || surah?.tafsir?.en || '',
});

const mapPreBismillah = (preBismillah) => {
  if (!preBismillah) return null;
  return {
    arabic: preBismillah?.text?.arab || '',
    transliteration: preBismillah?.text?.transliteration?.en || '',
    translation: preBismillah?.translation?.en || '',
  };
};

const mapVerses = (verses) =>
  (verses || []).map((verse) => ({
    number: verse?.number?.inSurah || verse?.number || 0,
    arabic: verse?.text?.arab || '',
    transliteration: verse?.text?.transliteration?.en || verse?.transliteration?.en || '',
    translation: verse?.translation?.en || '',
  }));

export const fetchSurahList = async () => {
  const json = await fetchJson('/surah');
  const list = Array.isArray(json?.data) ? json.data : [];
  return list.map(mapSurahSummary);
};

export const fetchSurahDetail = async (surahNumber) => {
  if (!surahNumber) {
    throw new Error('Surah number is required');
  }

  const json = await fetchJson(`/surah/${surahNumber}`);
  const data = json?.data;
  if (!data) {
    throw new Error('Invalid surah payload');
  }

  return {
    ...mapSurahSummary(data),
    preBismillah: mapPreBismillah(data?.preBismillah),
    verses: mapVerses(data?.verses),
  };
};
