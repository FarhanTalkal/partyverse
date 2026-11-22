import { z } from "zod";
import type { BrainCategory, Difficulty } from "@partyverse/shared";
import { BRAIN_BANK, type CuratedBrainQuestion } from "../../content/brainQuestions";
import { aiProvider } from "../openaiCompatible";
import { moderateFields } from "../moderation";

const aiQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "text"]),
  prompt: z.string().min(8).max(400),
  options: z.array(z.string()).min(2).max(4).optional(),
  answer: z.string().min(1).max(120),
  explanation: z.string().min(4).max(400),
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickCurated(
  category: BrainCategory,
  difficulty: Difficulty,
  used: Set<string>
): CuratedBrainQuestion {
  // Prefer never-seen IDs; only recycle after the curated bank is exhausted
  const unusedAny = BRAIN_BANK.filter((q) => !used.has(q.id));
  if (unusedAny.length === 0) {
    used.clear();
  }
  const pool = unusedAny.length > 0 ? unusedAny : BRAIN_BANK;
  const unusedCategory = pool.filter(
    (q) => category === "random" || q.category === category
  );
  // For "random", ignore difficulty so rounds don't collapse to the same medium subset
  const source =
    category === "random"
      ? unusedCategory.length > 0
        ? unusedCategory
        : pool
      : (() => {
          const exact = unusedCategory.filter((q) => q.difficulty === difficulty);
          if (exact.length > 0) return exact;
          if (unusedCategory.length > 0) return unusedCategory;
          return pool;
        })();
  return shuffle(source)[0];
}

export async function generateBrainQuestion(params: {
  category: BrainCategory;
  difficulty: Difficulty;
  usedIds: Set<string>;
}): Promise<CuratedBrainQuestion> {
  // Prefer curated unused questions so sessions don't repeat; AI only near bank exhaustion
  const curated = pickCurated(params.category, params.difficulty, params.usedIds);
  const usedCount = params.usedIds.size;
  if (usedCount < BRAIN_BANK.length * 0.9) {
    return curated;
  }

  const ai = await aiProvider.completeJson<{
    type: "multiple_choice" | "text";
    prompt: string;
    options?: string[];
    answer: string;
    explanation: string;
  }>({
    system:
      "You generate family-friendly Indian culture trivia and riddles for a party game (festivals, Bollywood, food, cricket, geography, mythology). Answers must be unambiguous. No adult, violent, or hateful content.",
    user: `Create one ${params.difficulty} India-focused ${params.category} question. Prefer multiple choice unless category is riddles.`,
    schemaHint:
      '{ "type": "multiple_choice"|"text", "prompt": string, "options"?: string[], "answer": string, "explanation": string }',
  });

  if (!ai) return curated;
  const parsed = aiQuestionSchema.safeParse(ai);
  if (!parsed.success) return curated;
  const q = parsed.data;
  if (q.type === "multiple_choice" && (!q.options || q.options.length < 2)) {
    return curated;
  }
  if (
    !moderateFields([
      q.prompt,
      q.answer,
      q.explanation,
      ...(q.options ?? []),
    ])
  ) {
    return curated;
  }

  return {
    id: `ai-${Date.now()}`,
    type: q.type,
    category:
      params.category === "random"
        ? curated.category
        : (params.category as CuratedBrainQuestion["category"]),
    difficulty: params.difficulty,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  };
}
