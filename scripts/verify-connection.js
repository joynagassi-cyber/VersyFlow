"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sdk_1 = require("@insforge/sdk");
// Use environment variables or defaults
var insforgeUrl = process.env.INFORGE_URL || 'https://wypi8tgf.eu-central.insforge.app';
var insforgeAnonKey = process.env.INFORGE_ANON_KEY || 'anon_5db10acfd8d50598afafe6d574dfd647edd9fba32514816c7f4c00346651a7c6';
console.log('=== InsForge Connection Verification ===\n');
console.log('INSFORGE_URL:', insforgeUrl);
console.log('INSFORGE_ANON_KEY:', (insforgeAnonKey === null || insforgeAnonKey === void 0 ? void 0 : insforgeAnonKey.substring(0, 20)) + '...');
try {
    var client = (0, sdk_1.createClient)({
        baseUrl: insforgeUrl,
        anonKey: insforgeAnonKey,
    });
    console.log('\n✓ Client instance created successfully');
    console.log('✓ Client.database property exists:', !!client.database);
    console.log('\n✅ All verification steps passed!');
}
catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
}
