// src/theme/index.ts
export const theme = {
  colors: {
    // Dark app look to match black splash
    bg: '#000000',            // app background
    card: '#0B0F1A',          // panels/cards
    input: '#0E1526',         // input background
    border: '#1E293B',        // thin borders
    text: '#FFFFFF',          // primary text
    hint: '#9AA4B2',          // secondary text
    primary: '#5B7CFF',       // brand accent (buttons, links)
    primaryText: '#ffffff',
    success: '#2EC971',
    warning: '#FFB020',
    danger: '#F25555',
  },
  radius: 12,
  spacing: 12,
  shadow: {
    // subtle shadow for cards/buttons
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 6 },
  },
};
export type Theme = typeof theme;