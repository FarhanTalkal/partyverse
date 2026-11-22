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

function pickCurated(
  category: BrainCategory,
  difficulty: Difficulty,
  used: Set<string>
): CuratedBrainQuestion {
  const unusedMatching = BRAIN_BANK.filter(
    (q) =>
      !used.has(q.id) &&
      q.difficulty === difficulty &&
      (category === "random" || q.category === category)
  );
  const unusedAny = BRAIN_BANK.filter((q) => !used.has(q.id));
  // Prefer unused questions; only recycle after the bank is exhausted
  const source =
    unusedMatching.length > 0
      ? unusedMatching
      : unusedAny.length > 0
        ? unusedAny
        : BRAIN_BANK;
  return source[Math.floor(Math.random() * source.length)];
}

export async function generateBrainQuestion(params: {
  category: BrainCategory;
  difficulty: Difficulty;
  usedIds: Set<string>;
}): Promise<CuratedBrainQuestion> {
  const curated = pickCurated(params.category, params.difficulty, params.usedIds);

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
      params.category === "random" ? curated.category : (params.category as CuratedBrainQuestion["category"]),
    difficulty: params.difficulty,
    prompt: q.prompt,
    options: q.options,
    answer: q.answer,
    explanation: q.explanation,
  };
}
