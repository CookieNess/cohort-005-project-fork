import { MAX_NOTE_LENGTH } from "~/lib/notes";
import { lengthStatus, type NoteLengthStatus } from "./lib/length-status";

export type { NoteLengthStatus, NoteLengthTone } from "./lib/length-status";

/**
 * The character counter under the note editor: how long the note is against
 * the most the save action accepts, and whether that is close to, or over,
 * the limit.
 */
export function noteLengthStatus(
  body: string,
  max: number = MAX_NOTE_LENGTH
): NoteLengthStatus {
  return lengthStatus(body.length, max);
}
