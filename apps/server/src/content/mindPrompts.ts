export interface CuratedMindPrompt {
  id: string;
  prompt: string;
  hint?: string;
}

export const MIND_BANK: CuratedMindPrompt[] = [
  {
    id: "mm-1",
    prompt: "Name a festival Indians celebrate with lights.",
    hint: "One word works best",
  },
  {
    id: "mm-2",
    prompt: "Name a street food you would eat at midnight.",
  },
  {
    id: "mm-3",
    prompt: "Name a Bollywood actor everyone knows.",
  },
  {
    id: "mm-4",
    prompt: "Name an Indian city famous for IT.",
  },
  {
    id: "mm-5",
    prompt: "Name a cricket shot.",
  },
  {
    id: "mm-6",
    prompt: "Name something you always pack for a train journey.",
  },
  {
    id: "mm-7",
    prompt: "Name a color on the Indian flag.",
  },
  {
    id: "mm-8",
    prompt: "Name a sweet served at Diwali.",
  },
  {
    id: "mm-9",
    prompt: "Name a river in India.",
  },
  {
    id: "mm-10",
    prompt: "Name a classic Indian board/carrom-night snack.",
  },
  {
    id: "mm-11",
    prompt: "Name something you bargain for in an Indian market.",
  },
  {
    id: "mm-12",
    prompt: "Name a monsoon-season vibe in one word.",
  },
];
