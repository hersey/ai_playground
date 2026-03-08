#!/usr/bin/env node

/**
 * NYC Pulse Setup Script
 * Helps configure VAPID keys for push notifications
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, "../backend/.env");

console.log("\n🗽 NYC Pulse Setup\n");
console.log("=".repeat(40));

// Generate VAPID keys
console.log("\n📡 Generating VAPID keys for push notifications...");
try {
  const result = execSync(
    'node -e "const wp = require(\'web-push\'); const k = wp.generateVAPIDKeys(); console.log(JSON.stringify(k));"',
    { cwd: path.join(__dirname, "../backend") }
  ).toString().trim();

  const keys = JSON.parse(result);

  console.log("\n✅ VAPID Keys generated!\n");
  console.log("Add these to backend/.env:\n");
  console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);

  // Add to .env if it doesn't have them
  if (fs.existsSync(ENV_PATH)) {
    let envContent = fs.readFileSync(ENV_PATH, "utf-8");
    if (!envContent.includes("VAPID_PUBLIC_KEY=")) {
      envContent += `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\n`;
      fs.writeFileSync(ENV_PATH, envContent);
      console.log("\n✅ VAPID keys added to backend/.env");
    }
  }
} catch {
  console.log("\n⚠️  Could not auto-generate VAPID keys. Run manually:");
  console.log('   cd backend && node -e "const wp = require(\'web-push\'); console.log(wp.generateVAPIDKeys())"');
}

console.log("\n=".repeat(40));
console.log("\n📋 Next steps:\n");
console.log("1. Copy backend/.env.example to backend/.env");
console.log("2. Add your ANTHROPIC_API_KEY to backend/.env");
console.log("3. Run: npm run dev (from the nyc-pulse root)");
console.log("4. Open http://localhost:5173 in your browser\n");
