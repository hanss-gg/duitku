// bot/utils/env-updater.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../../.env");

/**
 * Updates a specific key in the .env file.
 * If the key doesn't exist, it appends it.
 * Uses atomic write strategy to prevent corruption.
 */
export function updateEnv(key, value) {
  try {
    const tempPath = `${envPath}.tmp`;
    let content = "";

    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    const regex = new RegExp(`^${key}=.*`, "m");
    let newContent;

    if (regex.test(content)) {
      newContent = content.replace(regex, `${key}=${value}`);
    } else {
      newContent = content.trim() + `\n${key}=${value}\n`;
    }

    // Write to temp file first
    fs.writeFileSync(tempPath, newContent, "utf-8");
    // Atomic rename
    fs.renameSync(tempPath, envPath);
    
    console.log(`✅ .env updated: ${key}`);
  } catch (err) {
    console.error(`❌ Failed to update .env: ${err.message}`);
  }
}
