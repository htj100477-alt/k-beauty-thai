import { createClient } from '@/utils/supabase/server';
import ProductDetailClient from './ProductDetailClient';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('goods_no', id)
    .single();

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-100 p-4">
        <h2 className="text-lg font-bold mb-4">Product Not Found</h2>
        <Link href="/" className="px-4 py-2 bg-emerald-600 rounded-lg text-xs font-bold">
          Go Back Home
        </Link>
      </div>
    );
  }

  // Pass retrieved DB product details to Client Component for interactivity
  return <ProductDetailClient product={product} />;
}
