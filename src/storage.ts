import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { DigestData } from "./hosting.js";

const DATA_FILE = join(process.cwd(), "digests-data.json");

export function loadDigests(): DigestData[] {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  
  try {
    const data = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading digests:", error);
    return [];
  }
}

export function saveDigests(digests: DigestData[]): void {
  try {
    writeFileSync(DATA_FILE, JSON.stringify(digests, null, 2));
  } catch (error) {
    console.error("Error saving digests:", error);
    throw error;
  }
}

export function addDigest(digest: DigestData): DigestData[] {
  const digests = loadDigests();
  
  // Check if digest for this date already exists
  const existingIndex = digests.findIndex(d => {
    const existingDate = new Date(d.timestamp).toDateString();
    const newDate = new Date(digest.timestamp).toDateString();
    return existingDate === newDate;
  });
  
  if (existingIndex >= 0) {
    // Update existing digest
    digests[existingIndex] = digest;
    console.log(`Updated existing digest for ${digest.date}`);
  } else {
    // Add new digest
    digests.push(digest);
    console.log(`Added new digest for ${digest.date}`);
  }
  
  // Keep only the last 30 digests to avoid unlimited growth
  digests.sort((a, b) => b.timestamp - a.timestamp);
  const trimmedDigests = digests.slice(0, 30);
  
  saveDigests(trimmedDigests);
  return trimmedDigests;
}