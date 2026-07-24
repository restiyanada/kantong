import { normalizeIDRAmount } from "./normalizeAmount";
import { parseEnglishAbbrevDate } from "./parseDate";
import { decodeHtmlEntities } from "./decodeEntities";
import type { ParseResult } from "./types";

/**
 * Every Grab product shares the same sender (no-reply@grab.com) and mostly
 * the same subject ("Your Grab E-Receipt"), so type is detected from body
 * text instead. Order matters: check the most specific keyword first.
 *
 * Car vs Bike is matched loosely on the header line under the receipt title
 * (e.g. "GrabCar Priority (BETA)", "Bike Standard") — service tier
 * (Priority/Saver/Protect/etc) is ignored, only the Car/Bike keyword matters.
 */
type GrabType = "express" | "tip" | "food" | "car" | "bike";

function detectGrabType(subject: string, body: string): GrabType {
  const text = `${subject}\n${body}`;
  if (/GrabExpress/i.test(text)) return "express";
  if (/Tip\s+darimu\s+sudah\s+disalurkan/i.test(text)) return "tip";
  if (
    /GrabFood|Selamat\s+menikmati\s+makanan|Dine-in\s+Voucher|Hope\s+you\s+enjoyed\s+your\s+food/i.test(
      text
    )
  )
    return "food";
  if (/GrabCar/i.test(text)) return "car";
  return "bike"; // Bike Standard / other 2-wheeler ride types
}

/**
 * The hero total appears near the top of every Grab email as either
 * "Total Paid RP 13.000" (ride/car) or "TOTAL\nIDR 1950" / "TOTAL\nRp 46100"
 * (food/express/tip). Later in the same email, Faktur PPN (tax invoice)
 * sections repeat sub-amounts under labels like "Total Diskon" — since
 * regex.exec takes the leftmost match and the hero total always appears
 * first in the body, those nested amounts are never picked up.
 */
function extractTotal(body: string): number | null {
  const match =
    /Total(?:\s+Paid)?\s*[:\s]*\s*(?:RP|Rp|IDR)?\.?\s*([\d.,]+)/i.exec(body);
  return match ? normalizeIDRAmount(match[1]) : null;
}

function extractDriverName(body: string): string | null {
  const match = /Diterbitkan oleh pengemudi\s+([^\n]+)/.exec(body);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

/** Restaurant name from the "Pesanan Dari:" line (GrabFood receipts only). */
function extractRestaurant(body: string): string | null {
  const match = /Pesanan Dari:\s*\n([^\n]+)/.exec(body);
  return match ? decodeHtmlEntities(match[1].trim()) : null;
}

/**
 * Pickup and destination from the "Your Trip" section. The two location
 * names are each immediately followed by a time (e.g. "6:57PM"), which
 * distinguishes them from the distance/duration summary line above them
 * and any decorative timeline markers in between.
 */
function extractTripLocations(
  body: string
): { pickup: string; destination: string } | null {
  const tripIndex = body.search(/Your Trip/i);
  if (tripIndex === -1) return null;

  const section = body.slice(tripIndex);
  const locationRegex = /([^\n]+)\n\s*\d{1,2}:\d{2}\s*[AP]M/g;
  const matches = [...section.matchAll(locationRegex)];
  if (matches.length < 2) return null;

  return { pickup: decodeHtmlEntities(matches[0][1].trim()), destination: decodeHtmlEntities(matches[1][1].trim()) };
}

export function parseGrab(subject: string, body: string): ParseResult {
  const amount = extractTotal(body);
  if (!amount) return null;

  const date = parseEnglishAbbrevDate(body);
  if (!date) return null;

  const referenceMatch =
    /(?:Booking ID|Kode Booking|Pesanan ID)\s*:?\s*\n?\s*(\S+)/.exec(body);
  const referenceId = referenceMatch?.[1];

  const type = detectGrabType(subject, body);

  switch (type) {
    case "express":
      return {
        amount,
        category: "Other",
        pending: false,
        note: "GrabExpress",
        date,
        referenceId,
      };
    case "tip": {
      const driver = extractDriverName(body);
      return {
        amount,
        category: "Other",
        pending: false,
        note: driver ? `Tip - ${driver}` : "Grab Tip",
        date,
        referenceId,
      };
    }
    case "food": {
      const restaurant = extractRestaurant(body);
      return {
        amount,
        category: "Food",
        pending: false,
        note: restaurant ? `Grab Food - ${restaurant}` : "GrabFood",
        date,
        referenceId,
      };
    }
    case "car":
    case "bike": {
      const label = type === "car" ? "Grab Car" : "Grab Bike";
      const trip = extractTripLocations(body);
      return {
        amount,
        category: "Transport",
        pending: false,
        note: trip ? `${label} from ${trip.pickup} to ${trip.destination}` : label,
        date,
        referenceId,
      };
    }
  }
}
