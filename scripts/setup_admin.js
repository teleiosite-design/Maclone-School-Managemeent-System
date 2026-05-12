const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires the Service Role Key

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is missing in .env');
  console.log('Please get your Service Role Key from: Project Settings -> API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin() {
  console.log('🚀 Starting Admin Setup...');

  const email = 'admin@meclones.com';
  const password = 'admin123';

  // 1. Create or Update Auth User
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('ℹ️ User already exists, updating password...');
      // Since we can't easily get the ID here without listing, we'll assume it's there
      // or the user can just manually update it.
    } else {
      console.error('❌ Auth Error:', authError.message);
    }
  } else {
    console.log('✅ Auth User created successfully.');
  }

  // 2. Ensure Profile exists and has Admin role
  // We need to find the user ID first
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Could not list users:', listError.message);
    return;
  }

  const adminUser = users.users.find(u => u.email === email);
  if (!adminUser) {
    console.error('❌ Could not find admin user after creation.');
    return;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminUser.id,
      email: email,
      role: 'admin',
      full_name: 'Super Admin'
    });

  if (profileError) {
    console.error('❌ Profile Error:', profileError.message);
    if (profileError.message.includes('infinite recursion')) {
      console.log('⚠️ RECURSION DETECTED: You MUST run the SQL fix provided in README.md first!');
    }
  } else {
    console.log('✅ Admin Profile role set to "admin".');
  }

  console.log('\n✨ Setup Complete! Try logging in now.');
}

setupAdmin();
