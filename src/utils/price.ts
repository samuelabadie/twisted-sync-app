/**
 * Convert a Bookla price (always in fractional units / cents) to EUR.
 * Bookla API stores and returns prices in fractional units (e.g. 1000 = 10.00 EUR).
 * See: Bookla PricingRule docs - "Price in fractional units, e.g. 1000 for 10.00$"
 */
export function booklaCentsToEur(priceInCents: number): number {
  return priceInCents / 100;
}
