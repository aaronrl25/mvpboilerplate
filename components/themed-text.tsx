import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type StyledTextProps = TextProps & {
  type?: 'body' | 'title' | 'caption' | 'button';
};

export function StyledText({ style, type = 'body', ...rest }: StyledTextProps) {
  const color = useThemeColor({}, 'text');

  return (
    <Text
      style={[
        { color },
        styles[type],
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
        color: '#fff', // Use theme color for white text

  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 32,
    color: '#fff', // Use theme color for white text
  },
  caption: {
    fontSize: 12,
    opacity: 0.7, // Use opacity to de-emphasize, not color
  },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
        color: '#fff', // Use theme color for white text

  },
});
