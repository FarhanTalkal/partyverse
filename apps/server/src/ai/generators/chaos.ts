import { z } from "zod";
import { CHAOS_BANK, type CuratedChaosChallenge } from "../../content/chaosChallenges";
import { aiProvider } from "../openaiCompatible";
import { moderateFields } from "../moderation";

const schema = z.object({
  type: z.enum(["would_you_rather", "hypothetical", "popular", "creative", "vote"]),
  prompt: z.string().min(8).max(280),
  options: z.array(z.string()).min(2).max(4).optional(),
});

export async function generateChaosChallenge(
  usedIds: Set<string>
): Promise<CuratedChaosChallenge> {
  const pool = CHAOS_BANK.filter((c) => !usedIds.has(c.id));
  const curated = (pool.length ? pool : CHAOS_BANK)[
    Math.floor(Math.random() * (pool.length ? pool.length : CHAOS_BANK.length))
  ];

  const ai = await aiProvider.completeJson<z.infer<typeof schema>>({
    system:
      "Generate fun, family-friendly Indian party prompts (food, Bollywood, cricket, weddings, trains, chai). No offensive, sexual, violent, or discriminatory content.",
    user: "Create one playful India-themed multiplayer party prompt suitable for teens and adults.",
    schemaHint:
      '{ "type": "would_you_rather"|"hypothetical"|"popular"|"creative"|"vote", "prompt": string, "options"?: string[] }',
  });

  if (!ai) return curated;
  const parsed = schema.safeParse(ai);
  if (!parsed.success) return curated;
  if (!moderateFields([parsed.data.prompt, ...(parsed.data.options ?? [])])) {
    return curated;
  }

  return {
    id: `ai-chaos-${Date.now()}`,
    ...parsed.data,
  };
}
