const BLOCKED = [
  /\b(kill yourself|suicide)\b/i,
  /\b(nazi|hitler)\b/i,
  /\b(rape|pedophil|child porn)\b/i,
  /\b(slur_placeholder)\b/i,
];

export function isContentSafe(text: string): boolean {
  if (!text || text.trim().length < 2) return false;
  return !BLOCKED.some((re) => re.test(text));
}

export function moderateFields(fields: string[]): boolean {
  return fields.every((f) => isContentSafe(f));
}
