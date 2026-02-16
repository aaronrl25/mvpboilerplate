import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = 'Search jobs...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text); // Search as you type for better UX
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer, 
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
          ...Shadows.sm 
        }
      ]}>
        <IconSymbol name="magnifyingglass" size={18} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={handleChangeText}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <IconSymbol name="xmark.circle.fill" size={18} color={theme.icon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 48,
    gap: 12,
  },
  searchIcon: {
    // Icon color handled by theme
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
});