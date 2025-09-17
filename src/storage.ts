import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import type { DigestData } from "./hosting.js";

const DATA_FILE = join(process.cwd(), "digests-data.json");

export function loadDigests(): DigestData[] {
  if (!existsSync(DATA_FILE)) {
    console.log("No existing digest data file found, starting with empty list");
    return [];
  }
  
  try {
    const data = readFileSync(DATA_FILE, "utf-8");
    const digests = JSON.parse(data);
    
    // Validate the data structure
    if (!Array.isArray(digests)) {
      throw new Error("Digest data is not an array");
    }
    
    // Validate each digest has required fields
    for (const digest of digests) {
      if (!digest.date || !digest.timestamp || !digest.categories) {
        throw new Error(`Invalid digest structure: ${JSON.stringify(digest)}`);
      }
    }
    
    console.log(`Successfully loaded ${digests.length} digests from ${DATA_FILE}`);
    return digests;
  } catch (error) {
    console.error("Error loading digests:", error);
    
    // Try to load from backup
    const backupFile = `${DATA_FILE}.backup`;
    if (existsSync(backupFile)) {
      console.log("Attempting to load from backup file...");
      try {
        const backupData = readFileSync(backupFile, "utf-8");
        const backupDigests = JSON.parse(backupData);
        console.log(`Successfully loaded ${backupDigests.length} digests from backup`);
        return backupDigests;
      } catch (backupError) {
        console.error("Failed to load from backup:", backupError);
      }
    }
    
    console.log("Starting with empty digest list due to errors");
    return [];
  }
}

export function saveDigests(digests: DigestData[]): void {
  try {
    // Create backup of existing file before overwriting
    if (existsSync(DATA_FILE)) {
      const backupFile = `${DATA_FILE}.backup`;
      const existingData = readFileSync(DATA_FILE, "utf-8");
      writeFileSync(backupFile, existingData);
    }
    
    // Write the new data
    writeFileSync(DATA_FILE, JSON.stringify(digests, null, 2));
    console.log(`Successfully saved ${digests.length} digests to ${DATA_FILE}`);
  } catch (error) {
    console.error("Error saving digests:", error);
    
    // Try to restore from backup if it exists
    const backupFile = `${DATA_FILE}.backup`;
    if (existsSync(backupFile)) {
      console.log("Attempting to restore from backup...");
      try {
        const backupData = readFileSync(backupFile, "utf-8");
        writeFileSync(DATA_FILE, backupData);
        console.log("Successfully restored from backup");
      } catch (restoreError) {
        console.error("Failed to restore from backup:", restoreError);
      }
    }
    
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