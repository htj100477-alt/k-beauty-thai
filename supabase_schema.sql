-- Supabase Database Schema for Olive Young Thai Direct Purchase E-commerce

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goods_no VARCHAR(50) UNIQUE NOT NULL, -- Olive Young's Goods No (e.g., A000000247086)
    brand VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_krw INT NOT NULL, -- Original KRW price from Olive Young
    price_thb NUMERIC(10, 2) NOT NULL, -- Calculated THB selling price
    thumbnail_url TEXT, -- Product list preview image URL
    detail_description_image TEXT, -- Detailed description image URL
    ingredients TEXT, -- Cosmetic ingredients text
    precautions TEXT, -- Cosmetic usage precautions
    category VARCHAR(100), -- Category hierarchy (e.g., 뷰티 > 맨즈에딧 > 헤어케어)
    is_active BOOLEAN DEFAULT true, -- Whether to show on store
    is_sold_out BOOLEAN DEFAULT false, -- Stock status
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Product Policies: Anyone can read, only admin can write
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admin to insert/update/delete products" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');


-- 2. Create Global Settings Table (Exchange Rate, Margin, DDP Rates)
CREATE TABLE IF NOT EXISTS public.settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert Default Settings
INSERT INTO public.settings (key, value, description) VALUES
('exchange_rate_krw_thb', '38.0', 'Exchange rate: How many KRW per 1 THB (e.g., 38.0 KRW = 1 THB)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value, description) VALUES
('margin_percentage', '20', 'Default markup margin percentage (e.g., 20 = 20% markup)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value, description) VALUES
('ddp_shipping_fee_per_kg', '250', 'Han-Thai Shipping DDP air freight fee per kg in THB')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Settings Policies: Anyone can read, only admin can write
CREATE POLICY "Allow public read access to settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admin to write settings" ON public.settings
    FOR ALL USING (auth.role() = 'authenticated');


-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(100),
    shipping_address TEXT NOT NULL,
    total_amount_thb NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_payment' NOT NULL, -- pending_payment, paid, processing, shipped, completed, cancelled
    payment_method VARCHAR(50) DEFAULT 'promptpay' NOT NULL,
    proof_of_payment_url TEXT, -- URL to uploaded PromptPay receipt screenshot
    tracking_number VARCHAR(100), -- Han-Thai Shipping or Local Thai Courier Tracking No
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies: Users can insert (place orders), admin can read/write all
CREATE POLICY "Allow public to place orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admin to manage all orders" ON public.orders
    FOR ALL USING (auth.role() = 'authenticated');


-- 4. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INT NOT NULL,
    price_thb NUMERIC(10, 2) NOT NULL
);

-- Enable RLS on Order Items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Order Items Policies: Users can insert, admin can read/write all
CREATE POLICY "Allow public to insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated admin to manage all order items" ON public.order_items
    FOR ALL USING (auth.role() = 'authenticated');
