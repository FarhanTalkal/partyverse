import { config } from "../config";
import type { AiProvider } from "./provider";

export class OpenAiCompatibleProvider implements AiProvider {
  async completeJson<T>(params: {
    system: string;
    user: string;
    schemaHint: string;
  }): Promise<T | null> {
    if (!config.ai.enabled) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);

    try {
      const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.ai.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: config.ai.model,
          temperature: 0.8,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `${params.system}\nRespond with JSON only matching: ${params.schemaHint}`,
            },
            { role: "user", content: params.user },
          ],
        }),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;
      return JSON.parse(content) as T;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const aiProvider = new OpenAiCompatibleProvider();
