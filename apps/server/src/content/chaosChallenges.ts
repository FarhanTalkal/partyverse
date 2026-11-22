export interface CuratedChaosChallenge {
  id: string;
  type: "would_you_rather" | "hypothetical" | "popular" | "creative" | "vote";
  prompt: string;
  options?: string[];
}

export const CHAOS_BANK: CuratedChaosChallenge[] = [
  {
    id: "in-cc-1",
    type: "would_you_rather",
    prompt: "Would you rather have unlimited pani puri or unlimited butter chicken for life?",
    options: ["Unlimited pani puri", "Unlimited butter chicken"],
  },
  {
    id: "in-cc-2",
    type: "hypothetical",
    prompt: "You become Prime Minister for one day. What is your most chaotic first announcement?",
  },
  {
    id: "in-cc-3",
    type: "popular",
    prompt: "Best chai companion snack — what wins every time?",
  },
  {
    id: "in-cc-4",
    type: "creative",
    prompt: "Invent a new Indian festival. Give it a name and one wild tradition.",
  },
  {
    id: "in-cc-5",
    type: "vote",
    prompt: "Which Bollywood trope should be banned forever?",
  },
  {
    id: "in-cc-6",
    type: "would_you_rather",
    prompt: "Would you rather travel India only by trains or only by overnight buses?",
    options: ["Only trains", "Only overnight buses"],
  },
  {
    id: "in-cc-7",
    type: "hypothetical",
    prompt: "A talking auto-rickshaw becomes your best friend. What is its personality?",
  },
  {
    id: "in-cc-8",
    type: "popular",
    prompt: "What is the most overrated Indian street food?",
  },
  {
    id: "in-cc-9",
    type: "creative",
    prompt: "Write a 6-word story about an IPL final night.",
  },
  {
    id: "in-cc-10",
    type: "vote",
    prompt: "Which relative is the most chaotic at an Indian wedding?",
  },
  {
    id: "in-cc-11",
    type: "hypothetical",
    prompt: "You can rename one Indian city. What do you rename and why?",
  },
  {
    id: "in-cc-12",
    type: "creative",
    prompt: "Pitch a reality show set in a Mumbai local train in one sentence.",
  },
  {
    id: "in-cc-13",
    type: "would_you_rather",
    prompt: "Would you rather always get the window seat on trains or always get free platform chai?",
    options: ["Always window seat", "Always free chai"],
  },
  {
    id: "in-cc-14",
    type: "hypothetical",
    prompt: "Your family WhatsApp group makes you admin. What is your first rule?",
  },
  {
    id: "in-cc-15",
    type: "popular",
    prompt: "What is the ultimate rainy-day comfort food in India?",
  },
  {
    id: "in-cc-16",
    type: "creative",
    prompt: "Design a new IPL team mascot in one sentence.",
  },
  {
    id: "in-cc-17",
    type: "vote",
    prompt: "Which Indian festival has the best snacks?",
  },
  {
    id: "in-cc-18",
    type: "would_you_rather",
    prompt: "Would you rather live next to a noisy wedding lawn or a 24/7 construction site?",
    options: ["Wedding lawn", "Construction site"],
  },
  {
    id: "in-cc-19",
    type: "hypothetical",
    prompt: "You can add one item to every thali in India forever. What is it?",
  },
  {
    id: "in-cc-20",
    type: "popular",
    prompt: "Best road trip snack that never fails?",
  },
  {
    id: "in-cc-21",
    type: "creative",
    prompt: "Write a movie title for a comedy about neighbors fighting over parking.",
  },
  {
    id: "in-cc-22",
    type: "vote",
    prompt: "Which is more chaotic: airport security or railway reservation counters?",
  },
];
