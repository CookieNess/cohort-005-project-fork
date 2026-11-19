export type NoteLengthTone = "normal" | "warning" | "over";

export type NoteLengthStatus = {
  label: string;
  tone: NoteLengthTone;
};

// Warn before the limit, so the Student can trim the note while it still saves.
const WARNING_RATIO = 0.9;

export function lengthStatus(length: number, max: number): NoteLengthStatus {
  const label = `${length.toLocaleString("en")} / ${max.toLocaleString("en")}`;
  if (length > max) return { label, tone: "over" };
  if (length >= max * WARNING_RATIO) return { label, tone: "warning" };
  return { label, tone: "normal" };
}
