#!/usr/bin/env node
// Reset a Supabase auth user's password via the admin API.
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL (already in .env.local)
//   SUPABASE_SERVICE_ROLE_KEY (NOT in .env.local — get from Supabase Dashboard
//                              → Project Settings → API → service_role key)
//
// Usage:
//   export SUPABASE_SERVICE_ROLE_KEY=eyJ...
//   node scripts/reset-password.mjs pro@marketingflow.kr "NewPassword123!"
//
// Safety:
//   - Refuses to run without SUPABASE_SERVICE_ROLE_KEY in env
//   - Prints target user email + uuid before updating (one last chance to Ctrl+C)
//   - Never logs the password

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// --- Load .env.local for NEXT_PUBLIC_SUPABASE_URL ---------------
try {
  const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  console.warn('⚠️  .env.local not found — relying on process env');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not set');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set in env');
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role');
  console.error('   Then: export SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

const [, , email, newPassword] = process.argv;
if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-password.mjs <email> <new-password>');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Find the user ----------------------------------------------
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error('❌ listUsers failed:', listErr.message);
  process.exit(2);
}
const target = list.users.find(u => u.email === email);
if (!target) {
  console.error(`❌ User not found: ${email}`);
  process.exit(3);
}

console.log(`🎯 Target: ${target.email}`);
console.log(`   UUID:   ${target.id}`);
console.log(`   Created: ${target.created_at}`);
console.log('');
console.log('   Updating password in 2 seconds... (Ctrl+C to abort)');
await new Promise(r => setTimeout(r, 2000));

// --- Update password --------------------------------------------
const { error: updErr } = await admin.auth.admin.updateUserById(target.id, {
  password: newPassword,
});
if (updErr) {
  console.error('❌ Update failed:', updErr.message);
  process.exit(4);
}

console.log(`✅ Password reset complete for ${target.email}`);
