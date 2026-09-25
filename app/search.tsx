import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, TextInput, View } from 'react-native';

import { AppText, Chip, EmptyState, ItemCard, ItemGridSkeleton, Screen } from '../src/components';
import { styles } from '../src/screens/search.styles';
import { useGridCellWidth } from '../src/hooks/useGridCellWidth';
import { useSession } from '../src/stores/session';
import { colors } from '../src/theme/tokens';
import type { Item } from '../src/types/domain';

/** Wait this long after the last keystroke before asking the server. */
const DEBOUNCE_MS = 300;

const POPULAR = ['matkap', 'çadır', 'merdiven', 'projeksiyon', 'bisiklet', 'bebek arabası'];

/**
 * Never a blank search: recent and popular terms fill the empty screen,
 * results replace them as soon as there is a query, and no-results offers
 * to turn the search into a WANTED listing.
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const search = useSession((s) => s.search);
  const recent = useSession((s) => s.recentSearches);
  const rememberSearch = useSession((s) => s.rememberSearch);
  const showError = useSession((s) => s.showError);
  const [query, setQuery] = useState('');
  const cellWidth = useGridCellWidth();
  const [results, setResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const latest = useRef(0);

  // Debounced server search. Each request is numbered so a slow answer to
  // "mat" can never overwrite the answer to "matkap".
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const request = ++latest.current;
    const handle = setTimeout(() => {
      search(q)
        .then((found) => request === latest.current && setResults(found))
        .catch((error) => request === latest.current && showError(error))
        .finally(() => request === latest.current && setSearching(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query, search, showError]);

  const commit = (value: string) => {
    setQuery(value);
    if (value.trim()) rememberSearch(value.trim());
  };

  return (
    <Screen padded={false}>
      <View style={styles.searchRow}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textSubtle} />
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textSubtle}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => commit(query)}
          autoFocus
          returnKeyType="search"
        />
        {query ? (
          <Pressable accessibilityRole="button" onPress={() => setQuery('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSubtle} />
          </Pressable>
        ) : null}
      </View>
      </View>

      {!query.trim() ? (
        <View style={styles.suggestions}>
          {recent.length > 0 ? (
            <>
              <AppText variant="captionBold" tone="muted">
                {t('search.recent').toUpperCase()}
              </AppText>
              {recent.map((term) => (
                <Pressable key={term} accessibilityRole="button" onPress={() => commit(term)} style={styles.recentRow}>
                  <MaterialCommunityIcons name="history" size={20} color={colors.textSubtle} />
                  <AppText>{term}</AppText>
                </Pressable>
              ))}
            </>
          ) : null}
          <AppText variant="captionBold" tone="muted" style={styles.popularTitle}>
            {t('search.popular').toUpperCase()}
          </AppText>
          <View style={styles.popular}>
            {POPULAR.map((term) => (
              <Chip key={term} label={term} onPress={() => commit(term)} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <AppText variant="caption" tone="muted" style={styles.count}>
              {t('search.results', { count: results.length })}
            </AppText>
          }
          renderItem={({ item }) => (
            <View style={{ width: cellWidth }}>
              <ItemCard item={item} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} />
            </View>
          )}
          ListEmptyComponent={
            searching ? (
              <ItemGridSkeleton cellWidth={cellWidth} count={4} />
            ) : (
            <EmptyState
              icon="magnify-close"
              title={t('search.noResults', { query: query.trim() })}
              body={t('search.noResultsBody')}
              ctaLabel={t('search.askNeighbors')}
              onCta={() => router.replace('/(tabs)/create')}
            />
            )
          }
        />
      )}
    </Screen>
  );
}
