import { createClient } from '@/utils/supabase/server';
import ProductDetailClient from './ProductDetailClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';


interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  // goods_no (상품목록 링크) 또는 UUID id 둘 다 지원
  let { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('goods_no', id)
    .single();

  // goods_no로 못찾으면 UUID id로 재시도
  if (error || !product) {
    ({ data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single());
  }

  if (error || !product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-800 p-4">
        <h2 className="text-lg font-bold mb-4">Product Not Found</h2>
        <Link href="/" className="px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg text-xs font-bold transition-colors">
          Go Back Home
        </Link>
      </div>
    );
  }

  // Pass retrieved DB product details to Client Component for interactivity
  return <ProductDetailClient product={product} />;
}
