import { describe, it, expect } from "vitest";
import { decodeHtmlEntities } from "../decodeEntities";

describe("decodeHtmlEntities", () => {
  it("repairs Apps Script's mangled '&amp;' (delimiters stripped, name left bare)", () => {
    expect(decodeHtmlEntities("FARMER amp GRAM")).toBe("FARMER & GRAM");
  });

  it("decodes a literal named entity that survived intact", () => {
    expect(decodeHtmlEntities("FARMER &amp; GRAM")).toBe("FARMER & GRAM");
  });

  it("decodes numeric character references", () => {
    expect(decodeHtmlEntities("FARMER &#38; GRAM")).toBe("FARMER & GRAM");
  });

  it("leaves ordinary merchant text untouched", () => {
    expect(decodeHtmlEntities("QR CITITRANS WEB")).toBe("QR CITITRANS WEB");
  });

  it("collapses the double space left behind after repair", () => {
    expect(decodeHtmlEntities("A  amp  B")).toBe("A & B");
  });
});
