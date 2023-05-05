import { describe, expect, it } from "vitest";
import { bitText } from "@/utils/unit";

describe.concurrent("Test unit bit", () => {
  it.concurrent("Test unit bit text", () => {
    expect(bitText(800)).toBe("800B");
    expect(bitText(1000)).toBe("0.98KB");
    expect(bitText(1000000)).toBe("0.95MB");
  });
});
