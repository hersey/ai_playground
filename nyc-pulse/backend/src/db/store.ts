import fs from "fs";
import path from "path";

const DB_DIR = path.join(__dirname, "../../data");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export function readStore<T>(filename: string, defaultValue: T): T {
  const filePath = path.join(DB_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function writeStore<T>(filename: string, data: T): void {
  const filePath = path.join(DB_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export function readCache<T>(key: string): T | null {
  const cache = readStore<Record<string, CacheEntry<unknown>>>("cache.json", {});
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttlMs) return null;
  return entry.data as T;
}

export function writeCache<T>(key: string, data: T, ttlMs: number): void {
  const cache = readStore<Record<string, CacheEntry<unknown>>>("cache.json", {});
  cache[key] = { data, timestamp: Date.now(), ttlMs };
  writeStore("cache.json", cache);
}
