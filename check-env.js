#!/usr/bin/env node

// Simple script to check environment variables and Supabase configuration
console.log('🔍 Checking TalentoAI Environment Configuration...\n');

// Check required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
];

const optionalEnvVars = [
  'NEXT_PUBLIC_SITE_URL',
  'NODE_ENV'
];

console.log('📋 Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (optional)`);
  }
});

console.log('\n🔧 Current Configuration:');
console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Current Working Directory: ${process.cwd()}`);

// Check if .env.local exists
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file found');
} else {
  console.log('⚠️  .env.local file not found');
}

console.log('\n📝 Next Steps:');
console.log('1. Ensure all required environment variables are set in .env.local');
console.log('2. Verify Supabase project URL and anon key are correct');
console.log('3. Check Supabase dashboard for OAuth provider configuration');
console.log('4. Test authentication flow at /test-auth');
console.log('5. Check debug endpoint at /api/debug-auth');

console.log('\n🚀 Ready to test authentication!');
