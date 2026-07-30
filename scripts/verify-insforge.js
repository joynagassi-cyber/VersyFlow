#!/usr/bin/env node
// Simple verification script for InsForge SDK installation

const { createClient } = require('@insforge/sdk');

console.log('=== InsForge SDK Verification ===\n');

// 1. Verify SDK is installed
try {
  if (typeof createClient === 'function') {
    console.log('✓ createClient function is available');
  } else {
    console.error('✗ createClient is not a function');
    process.exit(1);
  }
} catch (e) {
  console.error('✗ Error importing SDK:', e.message);
  process.exit(1);
}

// 2. Verify environment variables
const insforgeUrl = process.env.INSFORGE_URL;
const insforgeAnonKey = process.env.INSFORGE_ANON_KEY;

if (insforgeUrl === 'https://wypi8tgf.eu-central.insforge.app') {
  console.log('✓ INSFORGE_URL is correctly set');
} else {
  console.error('✗ INSFORGE_URL is not set correctly. Expected:', 'https://wypi8tgf.eu-central.insforge.app', 'Got:', insforgeUrl);
  process.exit(1);
}

if (insforgeAnonKey === 'anon_5db10acfd8d50598afafe6d574dfd647edd9fba32514816c7f4c00346651a7c6') {
  console.log('✓ INSFORGE_ANON_KEY is correctly set');
} else {
  console.error('✗ INSFORGE_ANON_KEY is not set correctly');
  process.exit(1);
}

// 3. Verify client can be instantiated
try {
  const client = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey,
  });
  console.log('✓ Client instance can be created');
  console.log('\nAll InsForge setup checks passed!');
} catch (e) {
  console.error('✗ Error creating client:', e.message);
  process.exit(1);
}
