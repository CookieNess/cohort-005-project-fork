import { describe, it, expect } from "vitest";
import { noteLengthStatus } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const WARNING_AT = MAX_NOTE_LENGTH * 0.9;

describe("noteLengthStatus", () => {
  it("counts an empty note as zero of the limit", () => {
    expect(noteLengthStatus("")).toEqual({
      label: "0 / 2,000",
      tone: "normal",
    });
  });

  it("formats both numbers with thousands separators", () => {
    expect(noteLengthStatus("a".repeat(1234)).label).toBe("1,234 / 2,000");
  });

  it("stays normal just under 90% of the limit", () => {
    expect(noteLengthStatus("a".repeat(WARNING_AT - 1)).tone).toBe("normal");
  });

  it("warns from 90% of the limit", () => {
    expect(noteLengthStatus("a".repeat(WARNING_AT)).tone).toBe("warning");
  });

  it("still warns, not over, at exactly the limit the save action enforces", () => {
    expect(noteLengthStatus("a".repeat(MAX_NOTE_LENGTH)).tone).toBe("warning");
  });

  it("is over one character past the limit", () => {
    expect(noteLengthStatus("a".repeat(MAX_NOTE_LENGTH + 1))).toEqual({
      label: "2,001 / 2,000",
      tone: "over",
    });
  });

  it("ignores surrounding whitespace, as the save action trims before checking", () => {
    expect(noteLengthStatus(`  ${"a".repeat(MAX_NOTE_LENGTH)}\n`)).toEqual({
      label: "2,000 / 2,000",
      tone: "warning",
    });
  });
});
