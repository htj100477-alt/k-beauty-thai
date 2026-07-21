import { createClient } from '@/utils/supabase/server';
import StoreFrontClient from './StoreFrontClient';

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const initialCategoryId = resolvedSearchParams.category || 'all';

  const isPlaceholderUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || 
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');

  let exchangeRate = 38.0;
  let marginPercentage = 20;
  let ddpFee = 250;
  let categories: any[] = [];
  let products: any[] = [];

  if (isPlaceholderUrl) {
    categories = [
      { id: 'a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d', name_ko: '스킨케어', name_en: 'Skincare', parent_id: null },
      { id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', name_ko: '메이크업', name_en: 'Makeup', parent_id: null },
      { id: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', name_ko: '마스크팩', name_en: 'Mask Pack', parent_id: null },
      { id: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', name_ko: '바디케어', name_en: 'Body Care', parent_id: null },
      { id: 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', name_ko: '헤어케어', name_en: 'Hair Care', parent_id: null }
    ];

    products = [
      {
        id: '1',
        goods_no: 'A000000247086',
        brand: '다슈 (DASHU)',
        name: '[변우석 굿즈/탈모완화] 다슈 데일리 밀크씨슬 블루바이옴 스칼프 샴푸 500ml',
        price_krw: 16900,
        price_thb: 658.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000247086.jpg',
        category_id: 'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
        category_name: '헤어케어'
      },
      {
        id: '2',
        goods_no: 'A000000202777',
        brand: '헤라 (HERA)',
        name: '[프리미엄 1위] 헤라 블랙 쿠션 파운데이션 기획 (15g + 15g 리필포함) 9 Colors',
        price_krw: 59740,
        price_thb: 1916.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000202777.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '3',
        goods_no: 'A000000223414',
        brand: '메디힐 (MEDIHEAL)',
        name: '[15년 연속 1위] 메디힐 에센셜 마스크팩 10+1매 기획 세트 (티트리/콜라겐/마데카소사이드)',
        price_krw: 10000,
        price_thb: 391.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000223414.jpg',
        category_id: 'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
        category_name: '마스크팩'
      },
      {
        id: '4',
        goods_no: 'A000000259560',
        brand: '맥 (MAC)',
        name: '[NEW] MAC 러스터글래스 쉬어-샤인 립스틱 기획 단품 (촉촉한 립스틱)',
        price_krw: 37050,
        price_thb: 1183.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259560.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '5',
        goods_no: 'A000000240910',
        brand: '오아드 (Oiad)',
        name: '[단독기획] 오아드 립티크 13종 단품/기획 (초밀착 립틴트)',
        price_krw: 17500,
        price_thb: 568.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000240910.jpg',
        category_id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
        category_name: '메이크업'
      },
      {
        id: '6',
        goods_no: 'A000000259209',
        brand: '바세린 (Vaseline)',
        name: '[NEW] 바세린 글루타히야 세럼 바디로션 300ml 3종 택1 (듀이/플로리스/프로에이지)',
        price_krw: 10200,
        price_thb: 410.00,
        thumbnail_url: 'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259209.jpg',
        category_id: 'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
        category_name: '바디케어'
      }
    ];
  } else {
    const supabase = await createClient();

    // 1. Fetch settings
    try {
      const { data: settingsData } = await supabase.from('settings').select('*');
      if (settingsData) {
        const rate = settingsData.find(s => s.key === 'exchange_rate_krw_thb');
        const marg = settingsData.find(s => s.key === 'margin_percentage');
        const ddp = settingsData.find(s => s.key === 'ddp_shipping_fee_per_kg');
        if (rate) exchangeRate = parseFloat(rate.value);
        if (marg) marginPercentage = parseInt(marg.value);
        if (ddp) ddpFee = parseInt(ddp.value);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    }

    // 2. Fetch categories
    try {
      const { data: catData } = await supabase.from('categories').select('*');
      if (catData) categories = catData;
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }

    // 3. Fetch all active products once for instant client-side filtering
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsData) products = productsData;
    } catch (err) {
      console.warn('Failed to load products:', err);
    }
  }

  return (
    <StoreFrontClient
      categories={categories}
      allProducts={products}
      initialCategoryId={initialCategoryId}
      exchangeRate={exchangeRate}
      marginPercentage={marginPercentage}
      ddpFee={ddpFee}
    />
  );
}
