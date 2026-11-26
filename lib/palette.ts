// Colours chosen to sit with the logo's brown and gold.
export const colour = {
  brown: '#4B3832', gold: '#F0D378', cream: '#FCF9F1',
  sienna: '#6A3A28', forest: '#2E4537', terracotta: '#A64F2E', peacock: '#1E4A4E',
  sand: '#EBD2B8', aubergine: '#45293C', olive: '#6C6A33', mustard: '#D7A23A', clay: '#C67F5A',
} as const;

export type Tone = { bg: string; ink: string; accent: string; dark: boolean };
const onDark = (bg: string, accent: string = colour.gold): Tone => ({ bg, ink: '#FBF1DA', accent, dark: true });
const onLight = (bg: string, accent: string = '#8A3F22'): Tone => ({ bg, ink: colour.brown, accent, dark: false });

/** One per featured rice, in order. Neighbours always contrast. */
export const featuredTones: Tone[] = [
  onLight(colour.gold), onDark(colour.terracotta, '#FBDD8C'), onDark(colour.peacock), onLight(colour.sand), onDark(colour.aubergine),
];

/** One per rice family card: a soft two-tone, and the colour of its words. */
export type Card = { from: string; to: string; ink: string; cap: string };
const dark = '#34251F', light = '#FFF8E8';
export const familyCards: Record<string, Card> = {
  Basmati: { from: '#FBE9AE', to: '#E2AE43', ink: dark, cap: dark },
  Regional: { from: '#EDB38C', to: '#9A4426', ink: dark, cap: light },
  'Golden Sella': { from: '#FFDD8F', to: '#E08F35', ink: dark, cap: dark },
  Staff: { from: '#C4D9CB', to: '#2F6A65', ink: dark, cap: light },
  Biryani: { from: '#F4B894', to: '#A83B27', ink: dark, cap: light },
  'Sona Masoori': { from: '#F7EBD3', to: '#CFB386', ink: dark, cap: dark },
  Aromatic: { from: '#E1E2AE', to: '#9CA057', ink: dark, cap: dark },
  Healthy: { from: '#F5D2C2', to: '#9E4536', ink: dark, cap: light },
  Parboiled: { from: '#8C6D5E', to: '#4A332B', ink: light, cap: light },
};
export const fallbackCard: Card = { from: '#8C6D5E', to: '#4A332B', ink: light, cap: light };
/** The square behind a product card: its family's card colour, or warm sand. */
export const tileFor = (families: string[]) => familyCards[families[0]] ?? { from: '#F6EBD3', to: '#D8C29B', ink: dark, cap: dark };

/** Sets the page colour; components read it through --bg and data-theme. */
export function setPage(bg: string, dark: boolean) {
  const el = document.documentElement;
  el.style.setProperty('--bg', bg);
  el.dataset.theme = dark ? 'dark' : 'light';
}
export function clearPage() {
  document.documentElement.style.removeProperty('--bg');
  document.documentElement.dataset.theme = 'light';
}
