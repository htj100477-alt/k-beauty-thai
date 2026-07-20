/**
 * Utility for converting KRW prices to THB with margin and shipping fees.
 */

export interface PricingSettings {
  exchangeRateKrwThb: number; // e.g., 38.0
  marginPercentage: number;  // e.g., 20%
  ddpShippingFeePerKg: number; // e.g., 250 THB
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  exchangeRateKrwThb: 38.0,
  marginPercentage: 20,
  ddpShippingFeePerKg: 250,
};

/**
 * Calculates selling price in THB based on KRW cost, product weight, and settings.
 * Formula: THB Price = (KRW / Exchange Rate) * (1 + Margin) + (Weight in kg * Shipping fee per kg)
 */
export function calculateThbPrice(
  krwPrice: number,
  weightGrams: number = 200, // default weight 200g
  settings: PricingSettings = DEFAULT_PRICING_SETTINGS
): number {
  const weightKg = weightGrams / 1000;
  
  // Base cost converted to THB
  const baseThb = krwPrice / settings.exchangeRateKrwThb;
  
  // Margin added
  const priceWithMargin = baseThb * (1 + settings.marginPercentage / 100);
  
  // Shipping fee added
  const shippingFee = weightKg * settings.ddpShippingFeePerKg;
  
  // Total price rounded to nearest integer (standard in e-commerce)
  return Math.round(priceWithMargin + shippingFee);
}
