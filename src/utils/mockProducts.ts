/**
 * Fallback Mock Catalog (Empty).
 * All products are now fetched dynamically from Supabase database.
 */
export interface Product {
  id: string;
  goods_no: string;
  brand: string;
  name: string;
  price_krw: number;
  price_thb: number;
  thumbnail_url: string;
  detail_description_image: string;
  ingredients: string;
  precautions: string;
  category_name: string;
  weight_grams: number;
}

export const MOCK_PRODUCTS: Product[] = [];
