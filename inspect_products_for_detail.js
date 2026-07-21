const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const { data: products } = await supabase.from('products').select('*').eq('is_active', true);
  console.log('Total active products:', products.length);

  const { data: categories } = await supabase.from('categories').select('*');
  console.log('Total categories:', categories.length);

  // Check categories with products
  const activeCatIds = new Set(products.map(p => p.category_id));
  const activeCategories = categories.filter(c => activeCatIds.has(c.id));
  console.log('Categories directly having products:', activeCategories.length);

  // Check main categories having products (directly or via subcategories)
  const activeMainCatIds = new Set();
  categories.forEach(c => {
    if (activeCatIds.has(c.id)) {
      if (c.parent_id) activeMainCatIds.add(c.parent_id);
      else activeMainCatIds.add(c.id);
    }
  });
  console.log('Main categories having products:', activeMainCatIds.size);
}

run();
