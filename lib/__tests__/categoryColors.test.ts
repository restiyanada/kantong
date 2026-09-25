import { describe, it, expect } from "vitest";
import { categoryColor, distinctColors } from "../categoryColors";

describe("categoryColor", () => {
  it("keeps the fixed color for known categories", () => {
    expect(categoryColor("Food")).toBe("#3B6FA0");
  });

  it("gives an unknown name a stable non-grey color", () => {
    expect(categoryColor("Nabung")).toBe(categoryColor("Nabung"));
    expect(categoryColor("Nabung")).not.toBe("#9A9A94");
  });
});

describe("distinctColors", () => {
  it("never repeats a color within one set of names", () => {
    const colors = distinctColors(["Nabung", "Kuliah", "Kost", "Bayar Kosan", "General"]);
    const values = Object.values(colors);
    expect(new Set(values).size).toBe(values.length);
  });

  it("does not depend on the order names arrive in", () => {
    expect(distinctColors(["Kost", "Nabung", "Bayar Kosan"])).toEqual(
      distinctColors(["Bayar Kosan", "Kost", "Nabung"])
    );
  });
});
