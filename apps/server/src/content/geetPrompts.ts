export interface CuratedGeet {
  id: string;
  letter: string;
  hint?: string;
}

export const GEET_BANK: CuratedGeet[] = [
  { id: "ge-1", letter: "A", hint: "Any era" },
  { id: "ge-2", letter: "B", hint: "Bollywood classic" },
  { id: "ge-3", letter: "D", hint: "Dance number" },
  { id: "ge-4", letter: "J", hint: "Love song" },
  { id: "ge-5", letter: "K", hint: "2000s hit" },
  { id: "ge-6", letter: "M", hint: "Movie title song" },
  { id: "ge-7", letter: "P", hint: "Party anthem" },
  { id: "ge-8", letter: "R", hint: "Romantic" },
  { id: "ge-9", letter: "S", hint: "Sad / emotional" },
  { id: "ge-10", letter: "T", hint: "Title track vibes" },
  { id: "ge-11", letter: "Y", hint: "Youth / college" },
  { id: "ge-12", letter: "H", hint: "Item / peppy" },
  { id: "ge-13", letter: "L", hint: "Lullaby soft" },
  { id: "ge-14", letter: "N", hint: "90s nostalgia" },
];
