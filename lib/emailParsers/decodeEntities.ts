const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/**
 * Repairs HTML-entity corruption in merchant/description text pulled from
 * bank emails. Two things happen to the raw text before it reaches our
 * regex parsers:
 *
 *  1. Some senders' HTML survives intact into the body we parse, so a
 *     literal "&amp;" or numeric entity like "&#38;" can show up as-is.
 *  2. More often, Apps Script's `message.getPlainBody()` (which converts
 *     the source HTML to plain text) mangles named entities instead of
 *     decoding them: it strips the "&" and ";" but leaves the entity name
 *     as a bare word, so "FARMER &amp; GRAM" arrives as "FARMER amp GRAM".
 *     There's no way to distinguish that from a merchant genuinely
 *     containing the word "amp", so this only repairs the small set of
 *     entity names above — a real tradeoff, but one of those two failure
 *     modes (mis-parsed merchant names) is far more common than the other
 *     (a merchant actually named e.g. "AMP").
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp);/gi,
      (_match, name: string) => NAMED_ENTITIES[name.toLowerCase()]
    )
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCharCode(Number(code)))
    .replace(
      /\b(amp|lt|gt|quot|apos)\b/gi,
      (_match, name: string) => NAMED_ENTITIES[name.toLowerCase()]
    )
    .replace(/\s{2,}/g, " ")
    .trim();
}
