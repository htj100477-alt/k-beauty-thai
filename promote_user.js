const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gmjcsnmlyyjnraqiqqwg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtamNzbm1seXlqbnJhcWlxcXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUyMTA2MCwiZXhwIjoyMTAwMDk3MDYwfQ.c2f4_R6gIhgwIgC1C4WJZpvZXQ9CBdWCqSR1qrxF0QU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  const email = '0811112222@kbeauty-thai.com';
  console.log(`Listing users to find: ${email}...`);
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const user = data.users.find(u => u.email === email);
    if (!user) {
      console.log(`User ${email} not found in Supabase Auth yet.`);
      return;
    }

    console.log(`User found (ID: ${user.id}). Promoting to admin role...`);
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          role: 'admin',
          phone_number: '081-111-2222'
        }
      }
    );

    if (updateError) throw updateError;
    console.log('Successfully promoted user to admin!');
    console.log('Updated Metadata:', updateData.user.user_metadata);
  } catch (err) {
    console.error('Error during promotion:', err);
  }
}

run();
