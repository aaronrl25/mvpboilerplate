import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

export type StyledViewProps = ViewProps;

export function StyledView({ style, ...otherProps }: StyledViewProps) {
  const backgroundColor = useThemeColor({}, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
