/**
 * Colors for the CineMatch app, designed for a dark, cinematic UI.
 */

const tintColorLight = '#E50914'; // A vibrant red for accents
const tintColorDark = '#E50914';

export const Colors = {
  light: {
    text: 'black', // Almost black
    background: '#FFFFFF', // White
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F5F5F5', // Light grey for cards
    secondaryText: '#333333',
  },
  dark: {
    text: '#EAEAEA', // Off-white
    background: '#121212', // Very dark grey
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1A1A1A', // Slightly lighter dark grey
    secondaryText: '#A9A9A9', // Lighter grey
    danger: '#ff4a4a',
  },
};
