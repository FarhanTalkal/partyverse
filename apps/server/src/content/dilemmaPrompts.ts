export interface CuratedDilemma {
  id: string;
  prompt: string;
  options: [string, string];
}

export const DILEMMA_BANK: CuratedDilemma[] = [
  {
    id: "di-1",
    prompt: "Office lunch emergency — what saves you?",
    options: ["Maggi in the pantry", "Swiggy in 20 mins"],
  },
  {
    id: "di-2",
    prompt: "Weekend plans with cousins:",
    options: ["Mall + movie", "Home + antakshari"],
  },
  {
    id: "di-3",
    prompt: "Train journey must-have:",
    options: ["Window seat", "Lower berth"],
  },
  {
    id: "di-4",
    prompt: "Chai debate forever:",
    options: ["Cutting chai", "Filter coffee"],
  },
  {
    id: "di-5",
    prompt: "Rainy evening craving:",
    options: ["Pakora + chai", "Hot chocolate"],
  },
  {
    id: "di-6",
    prompt: "Wedding season survival:",
    options: ["Dance floor all night", "Food stall circuit"],
  },
  {
    id: "di-7",
    prompt: "Cricket final night:",
    options: ["Stadium vibe on TV loud", "Silent phone score updates"],
  },
  {
    id: "di-8",
    prompt: "Late-night snack run:",
    options: ["Biryani", "Ice cream"],
  },
  {
    id: "di-9",
    prompt: "Festival shopping:",
    options: ["Big bazaar haul", "One perfect outfit"],
  },
  {
    id: "di-10",
    prompt: "Road trip soundtrack:",
    options: ["90s Bollywood", "Latest chartbusters"],
  },
  {
    id: "di-11",
    prompt: "Guest is coming in 10 minutes:",
    options: ["Hide the mess", "Order snacks now"],
  },
  {
    id: "di-12",
    prompt: "Auto vs metro when late:",
    options: ["Negotiate the auto", "Sprint to metro"],
  },
];
