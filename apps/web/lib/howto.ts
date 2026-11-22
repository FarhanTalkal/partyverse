import type { GameMode } from "@partyverse/shared";

export const HOWTO_STEPS: Record<GameMode, string[]> = {
  brain: [
    "A trivia question appears for everyone at once.",
    "Tap or type your answer before the timer ends.",
    "Faster correct answers earn more points.",
    "Most points after all rounds wins.",
  ],
  chaos: [
    "You'll get a fun prompt — write a creative answer.",
    "Answers are shown anonymously.",
    "Vote for your favorite (not your own).",
    "Votes earn points — be funny, be bold.",
  ],
  bluff: [
    "Read the case and your private brief carefully.",
    "Discuss in chat during discussion time.",
    "Tick ready when you're set — voting can start early.",
    "Vote for who you think the culprit is.",
  ],
  mind: [
    "Everyone gets the same prompt.",
    "Type a short answer without coordinating.",
    "Matching answers with others score points.",
    "Think like the group — or surprise them.",
  ],
  dilemma: [
    "Two options appear — pick one side.",
    "Some rounds reward the majority, some the minority.",
    "Watch the banner to know which scoring is active.",
    "Lock in before the timer ends.",
  ],
  geet: [
    "You'll get a letter (and sometimes a hint).",
    "Type a song title that starts with that letter.",
    "Titles are shown anonymously — then vote for the best.",
    "Votes and submissions earn points.",
  ],
};
