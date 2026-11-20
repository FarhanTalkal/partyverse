import { BLUFF_BANK, type CuratedBluffScenario } from "../../content/bluffScenarios";
import { aiProvider } from "../openaiCompatible";
import { moderateFields } from "../moderation";
import { z } from "zod";

const roleSchema = z.object({
  role: z.string(),
  background: z.string(),
  secretObjective: z.string(),
  privateClues: z.array(z.string()).min(1),
  isCulprit: z.boolean(),
});

const scenarioSchema = z.object({
  title: z.string(),
  synopsis: z.string(),
  publicClues: z.array(z.string()).min(3),
  roles: z.array(roleSchema).min(4).max(8),
});

function pickScenario(playerCount: number): CuratedBluffScenario {
  const suitable = BLUFF_BANK.filter((s) => s.roles.length >= playerCount);
  const pool = suitable.length ? suitable : BLUFF_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}

function validateConsistency(scenario: CuratedBluffScenario, playerCount: number): boolean {
  const culprits = scenario.roles.filter((r) => r.isCulprit);
  if (culprits.length !== 1) return false;
  if (scenario.roles.length < playerCount) return false;
  return moderateFields([
    scenario.title,
    scenario.synopsis,
    ...scenario.publicClues,
    ...scenario.roles.flatMap((r) => [
      r.role,
      r.background,
      r.secretObjective,
      ...r.privateClues,
    ]),
  ]);
}

export async function generateBluffScenario(
  playerCount: number
): Promise<CuratedBluffScenario> {
  const curated = pickScenario(playerCount);

  const ai = await aiProvider.completeJson<z.infer<typeof scenarioSchema>>({
    system:
      "Create a light social-deduction mystery for a party game. Exactly one culprit. Family-friendly. Roles and clues must be logically consistent.",
    user: `Create a mystery for ${playerCount} players with exactly one culprit role.`,
    schemaHint:
      '{ "title": string, "synopsis": string, "publicClues": string[], "roles": [{ "role", "background", "secretObjective", "privateClues": string[], "isCulprit": boolean }] }',
  });

  if (!ai) return curated;
  const parsed = scenarioSchema.safeParse(ai);
  if (!parsed.success) return curated;

  const scenario: CuratedBluffScenario = {
    id: `ai-bluff-${Date.now()}`,
    ...parsed.data,
  };

  if (!validateConsistency(scenario, playerCount)) return curated;
  return scenario;
}
