// Wellness Design System Color Palette
const primary = '#464daf'; // blue primary color
const successAccent = '#B8D4B4'; // Light sage
const background = '#28282B'; // black
const accent1 = '#F4D03F'; // Soft yellow 
const accent2 = '#4A90E2'; // Bright blue 
const coral = '#FF6B6B'; // Coral for alerts
const text = '#e9e2e2'; // white 
const secondaryText = '#e9e2e2'; // white
const borderColor = '#E0E0E0'; // Medium gray 

export const Colors = {
  light: {
    text: text,
    background: background,
    tint: primary,
    icon: secondaryText,
    tabIconDefault: secondaryText,
    tabIconSelected: primary,
    success: successAccent,
    error: coral,
    accent: accent2,
    highlight: accent1,
    cardBackground: '#333339',
    border: borderColor,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primary,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primary,
    success: successAccent,
    error: coral,
    accent: accent2,
    highlight: accent1,
    cardBackground: '#2A2A2A',
    border: '#404040',
  },
};
