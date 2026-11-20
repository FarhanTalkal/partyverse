export interface AiProvider {
  completeJson<T>(params: {
    system: string;
    user: string;
    schemaHint: string;
  }): Promise<T | null>;
}
