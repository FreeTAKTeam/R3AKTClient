export type ParsedPayloadResult =
  | { ok: true; value: unknown }
  | { ok: false; error: Error };

export class InvalidPayloadJsonError extends Error {
  readonly kind = "InvalidPayloadJsonError";

  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadJsonError";
  }
}

export function tryParsePayload(payloadJson: string): ParsedPayloadResult {
  const trimmed = payloadJson.trim();
  if (!trimmed) {
    return { ok: true, value: {} };
  }

  try {
    return { ok: true, value: JSON.parse(trimmed) as unknown };
  } catch (error: unknown) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
