import { describe, it, expect } from "vitest";
import { noteLengthStatus } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("noteLengthStatus", () => {
  it("counts an empty note as zero of the limit", () => {
    expect(noteLengthStatus("")).toEqual({
      label: `0 / ${MAX_NOTE_LENGTH.toLocaleString("en")}`,
      tone: "normal",
    });
  });

  it("formats both numbers with thousands separators", () => {
    expect(noteLengthStatus("a".repeat(1234), 10000).label).toBe(
      "1,234 / 10,000"
    );
  });

  it("stays normal just under 90% of the limit", () => {
    expect(noteLengthStatus("a".repeat(89), 100).tone).toBe("normal");
  });

  it("warns from 90% of the limit", () => {
    expect(noteLengthStatus("a".repeat(90), 100).tone).toBe("warning");
  });

  it("still warns, not over, at exactly the limit", () => {
    expect(noteLengthStatus("a".repeat(100), 100).tone).toBe("warning");
  });

  it("is over one character past the limit", () => {
    expect(noteLengthStatus("a".repeat(101), 100)).toEqual({
      label: "101 / 100",
      tone: "over",
    });
  });

  it("defaults to the limit the save action enforces", () => {
    expect(noteLengthStatus("a".repeat(MAX_NOTE_LENGTH + 1)).tone).toBe("over");
    expect(noteLengthStatus("a".repeat(MAX_NOTE_LENGTH)).tone).toBe("warning");
  });
});
