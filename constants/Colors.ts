/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Wellness Design System Color Palette
const primarySage = '#8FAE8B'; // Primary sage green
const darkSage = '#6B8A67'; // Darker sage for buttons
const lightSage = '#B8D4B4'; // Light sage for accents
const cream = '#F5F1E8'; // Cream background
const warmBeige = '#E8DCC0'; // Warm beige
const softYellow = '#F4D03F'; // Soft yellow for highlights
const brightBlue = '#4A90E2'; // Bright blue for accents
const coral = '#FF6B6B'; // Coral for alerts
const pink = '#E91E63'; // Pink for special elements
const charcoal = '#424242'; // Charcoal for text
const darkGray = '#757575'; // Dark gray for secondary text
const mediumGray = '#E0E0E0'; // Medium gray for borders
const lightGray = '#F8F8F8'; // Light gray for backgrounds

export const Colors = {
  light: {
    text: charcoal,
    background: cream,
    tint: primarySage,
    icon: darkGray,
    tabIconDefault: darkGray,
    tabIconSelected: primarySage,
    success: lightSage,
    error: coral,
    accent: brightBlue,
    highlight: softYellow,
    cardBackground: '#FFFFFF',
    border: mediumGray,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primarySage,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primarySage,
    success: lightSage,
    error: coral,
    accent: brightBlue,
    highlight: softYellow,
    cardBackground: '#2A2A2A',
    border: '#404040',
  },
};
