-- Supabase Database Schema for K-Beauty Thai Direct Purchase E-commerce

-- 0. Wipe existing database structures to prevent schema collision (Fresh Install)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Create Profiles Table (Synced automatically with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL, -- admin, staff, user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Profiles
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins/staff to select all profiles" ON public.profiles;
CREATE POLICY "Allow admins/staff to select all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );

DROP POLICY IF EXISTS "Allow admins to update profiles" ON public.profiles;
CREATE POLICY "Allow admins to update profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND public.profiles.role = 'admin'
        )
    );


-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name_ko VARCHAR(100) UNIQUE NOT NULL, -- e.g., '스킨케어'
    name_en VARCHAR(100) NOT NULL,        -- e.g., 'Skincare'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Categories
DROP POLICY IF EXISTS "Allow public read access to categories" ON public.categories;
CREATE POLICY "Allow public read access to categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins/staff to manage categories" ON public.categories;
CREATE POLICY "Allow admins/staff to manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );


-- 3. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goods_no VARCHAR(50) UNIQUE NOT NULL, -- Olive Young's Goods No
    brand VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_krw INT NOT NULL, -- Original KRW price
    price_thb NUMERIC(10, 2) NOT NULL, -- Calculated THB selling price
    thumbnail_url TEXT, -- Preview image URL
    detail_description_image TEXT, -- Detailed description image URL
    ingredients TEXT, -- Cosmetic ingredients text
    precautions TEXT, -- Cosmetic usage precautions
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name VARCHAR(100), -- Display helper
    weight_grams INT DEFAULT 200, -- Product weight in grams
    is_active BOOLEAN DEFAULT true,
    is_sold_out BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Products
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins/staff to manage products" ON public.products;
CREATE POLICY "Allow admins/staff to manage products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );


-- 4. Create Global Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Settings
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
CREATE POLICY "Allow public read access to settings" ON public.settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins/staff to manage settings" ON public.settings;
CREATE POLICY "Allow admins/staff to manage settings" ON public.settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );


-- 5. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_province VARCHAR(100) NOT NULL,
    shipping_district VARCHAR(100) NOT NULL,
    shipping_address_detail TEXT NOT NULL,
    total_amount_thb NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_payment' NOT NULL, -- pending_payment, paid, processing, shipped, completed, cancelled
    payment_method VARCHAR(50) DEFAULT 'promptpay' NOT NULL,
    proof_of_payment_url TEXT, -- PromptPay receipt screenshot URL
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Orders
DROP POLICY IF EXISTS "Allow public/users to place orders" ON public.orders;
CREATE POLICY "Allow public/users to place orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read their own orders" ON public.orders;
CREATE POLICY "Allow users to read their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Allow admins/staff to manage all orders" ON public.orders;
CREATE POLICY "Allow admins/staff to manage all orders" ON public.orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );


-- 6. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INT NOT NULL,
    price_thb NUMERIC(10, 2) NOT NULL
);

-- Enable RLS on Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Drop and Recreate policies for Order Items
DROP POLICY IF EXISTS "Allow public/users to insert order items" ON public.order_items;
CREATE POLICY "Allow public/users to insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to read their own order items" ON public.order_items;
CREATE POLICY "Allow users to read their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE public.orders.id = order_id
            AND (public.orders.customer_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

DROP POLICY IF EXISTS "Allow admins/staff to manage all order items" ON public.order_items;
CREATE POLICY "Allow admins/staff to manage all order items" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid() 
            AND (public.profiles.role = 'admin' OR public.profiles.role = 'staff')
        )
    );


-- 7. Automatic Trigger to Sync auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'phone_number', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safety
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 8. Seed Default Settings
INSERT INTO public.settings (key, value, description) VALUES
('exchange_rate_krw_thb', '38.0', 'Exchange rate: How many KRW per 1 THB (e.g., 38.0 KRW = 1 THB)'),
('margin_percentage', '20', 'Default markup margin percentage (e.g., 20 = 20% markup)'),
('ddp_shipping_fee_per_kg', '250', 'Han-Thai Shipping DDP air freight fee per kg in THB')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- 9. Seed Default Categories
INSERT INTO public.categories (id, name_ko, name_en) VALUES
('a0b1c2d3-e4f5-6a7b-8c9d-0e1f2a3b4c5d', '스킨케어', 'Skincare'),
('b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e', '메이크업', 'Makeup'),
('c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f', '마스크팩', 'Mask Pack'),
('d3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a', '바디케어', 'Body Care'),
('e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b', '헤어케어', 'Hair Care')
ON CONFLICT (name_ko) DO NOTHING;


-- 10. Seed Scraped Products referencing Categories
INSERT INTO public.products (goods_no, brand, name, price_krw, price_thb, thumbnail_url, detail_description_image, ingredients, precautions, category_id, category_name, weight_grams) VALUES
(
  'A000000247086',
  '다슈 (DASHU)',
  '[변우석 굿즈/탈모완화] 다슈 데일리 밀크씨슬 블루바이옴 스칼프 샴푸 500ml',
  16900,
  658.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000247086.jpg',
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000247086_detail.jpg',
  '정제수, 소듐C14-16올레핀설포네이트, 라우릴하이드록시설테인, 카페인, 소듐클로라이드, 엘-멘톨, 향료,스타이렌/아크릴레이트코폴리머, 소듐벤조에이트, 하이드록시아세토페논, 피피지-3카프릴릴에터, 구아하이드록시프로필트라이모늄클로라이드, 카프릴릴글라이콜, 트라이하이드록시스테아린, 소듐설페이트, 테트라데센, 헥사데센, 시트릭애씨드, 코코-글루코사이드, 폴리쿼터늄-10, 글리세린, 에틸헥실글리세린, 다이소듐이디티에이, 벤조익애씨드, 흰무늬엉겅퀴추출물(10,000ppb), 부틸렌글라이콜, 1,2-헥산다이올, 비피다발효추출물(1,000ppb), 락토바실러스발효용해물(1,100ppb), 락토코쿠스발효추출물(1,000ppb),빙하수, 알지닌, 서양민들레잎추출물, 검정콩추출물, 약모밀추출물, 병풀캘러스세포외소포, 맥주효모추출물, 하이드록시시트로넬알, 리모넨, 리날룰',
  '1. 화장품 사용 시 또는 사용 후 직사광선에 의하여 사용부위가 붉은 반점, 부어오름 또는 가려움증 등의 이상 증상이나 부작용이 있는 경우에는 전문의 등과 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 보관 및 취급 시 주의사항 가. 어린이의 손이 닿지 않는 곳에 보관할 것 나. 직사광선을 피해서 보관할 것 4. 눈에 들어갔을 때 즉시 씻어낼 것',
  'e4f5a6b7-c8d9-0e1f-2a3b-4c5d6e7f8a9b',
  '헤어케어',
  500
),
(
  'A000000202777',
  '헤라 (HERA)',
  '[프리미엄 1위] 헤라 블랙 쿠션 파운데이션 기획 (15g + 15g 리필포함) 9 Colors',
  59740,
  1916.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000202777.jpg',
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000202777_detail.jpg',
  '정제수, 메틸트라이메티콘, 티타늄디옥사이드, 다이메티콘, 에틸헥실메톡시신나메이트, 실리카, 폴리메틸메타크릴레이트, 부틸렌글라이콜다이카프릴레이트/다이카프레이트, 나이아신아마이드, 아데노신, 하이알루로닉애씨드',
  '1. 사용 중 붉은 반점, 부어오름, 가려움증 등의 이상이 있는 경우 전문의와 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 직사광선을 피해서 보관할 것',
  'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
  '메이크업',
  100
),
(
  'A000000223414',
  '메디힐 (MEDIHEAL)',
  '[15년 연속 1위] 메디힐 에센셜 마스크팩 10+1매 기획 세트 (티트리/콜라겐/마데카소사이드)',
  10000,
  391.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000223414.jpg',
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000223414_detail.jpg',
  '정제수, 글리세린, 프로판다이올, 티트리잎추출물(10,000ppm), 마데카소사이드(100ppm), 병풀추출물',
  '1. 화장품 사용 시 이상이 있는 경우 사용을 중지하고 피부과 전문의에게 상담할 것 2. 상처가 있는 부위 등에는 사용을 자제할 것 3. 어린이의 손이 닿지 않는 곳에 보관할 것',
  'c2d3e4f5-a6b7-8c9d-0e1f-2a3b4c5d6e7f',
  '마스크팩',
  300
),
(
  'A000000259560',
  '맥 (MAC)',
  '[NEW] MAC 러스터글래스 쉬어-샤인 립스틱 기획 단품 (촉촉한 립스틱)',
  37050,
  1183.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259560.jpg',
  NULL,
  '다라이소프로필말레이트, 하이드로제네이티드폴리아이소부텐, 비스-베헤닐/아이소스테아릴/피토스체릴다이머다이리놀레일다이머다이리놀리에이트',
  '1. 상처가 있는 부위에는 사용을 자제할 것 2. 유소아의 손이 닿지 않는 곳에 보관할 것',
  'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
  '메이크업',
  50
),
(
  'A000000240910',
  '오아드 (Oiad)',
  '[단독기획] 오아드 립티크 13종 단품/기획 (초밀착 립틴트)',
  17500,
  568.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000240910.jpg',
  NULL,
  '다이메티콘, 정제수, 부틸렌글라이콜, 다이메티콘크로스폴리머, 글리세린',
  '1. 눈에 들어가지 않도록 주의할 것 2. 상처 부위 사용 자제 3. 직사광선 피할 것',
  'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
  '메이크업',
  60
),
(
  'A000000259209',
  '바세린 (Vaseline)',
  '[NEW] 바세린 글루타히야 세럼 바디로션 300ml 3종 택1 (듀이/플로리스/프로에이지)',
  10200,
  410.00,
  'https://gmjcsnmlyyjnraqiqqwg.supabase.co/storage/v1/object/public/product-images/A000000259209.jpg',
  NULL,
  '정제수, 글리세린, 나이아신아마이드, 글루타티온, 소듐하이알루로네이트, 토코페릴아세테이트',
  '1. 피부에 이상이 생겼을 경우 사용을 중지하고 전문의와 상담할 것 2. 직사광선을 피해 서늘한 곳에 보관할 것',
  'd3e4f5a6-b7c8-9d0e-1f2a-3b4c5d6e7f8a',
  '바디케어',
  350
)
ON CONFLICT (goods_no) DO UPDATE SET
  brand = EXCLUDED.brand,
  name = EXCLUDED.name,
  price_krw = EXCLUDED.price_krw,
  price_thb = EXCLUDED.price_thb,
  thumbnail_url = EXCLUDED.thumbnail_url,
  detail_description_image = EXCLUDED.detail_description_image,
  ingredients = EXCLUDED.ingredients,
  precautions = EXCLUDED.precautions,
  category_id = EXCLUDED.category_id,
  category_name = EXCLUDED.category_name,
  weight_grams = EXCLUDED.weight_grams;
