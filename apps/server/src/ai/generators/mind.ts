import { MIND_BANK, type CuratedMindPrompt } from "../../content/mindPrompts";
import { aiProvider } from "../openaiCompatible";
import { moderateFields } from "../moderation";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().min(8).max(160),
  hint: z.string().max(80).optional(),
});

export async function generateMindPrompt(
  usedIds: Set<string>
): Promise<CuratedMindPrompt> {
  const pool = MIND_BANK.filter((p) => !usedIds.has(p.id));
  const curated = (pool.length ? pool : MIND_BANK)[
    Math.floor(Math.random() * (pool.length ? pool.length : MIND_BANK.length))
  ];

  const ai = await aiProvider.completeJson<z.infer<typeof schema>>({
    system:
      "Generate short family-friendly Mind Match prompts about Indian culture. Answers should be common one-word/short-phrase things people might sync on.",
    user: "Create one Indian-culture prompt for a mind-matching party game.",
    schemaHint: '{ "prompt": string, "hint"?: string }',
  });

  if (!ai) return curated;
  const parsed = schema.safeParse(ai);
  if (!parsed.success) return curated;
  if (!moderateFields([parsed.data.prompt, parsed.data.hint ?? "ok"])) {
    return curated;
  }

  return {
    id: `ai-mind-${Date.now()}`,
    prompt: parsed.data.prompt,
    hint: parsed.data.hint,
  };
}
