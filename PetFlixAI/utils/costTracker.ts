import * as FileSystem from 'expo-file-system';

const COST_FILE_URI = FileSystem.documentDirectory + 'apiCost.json';
const MAX_COST_USD = 50.00;
const COST_PER_6_SECONDS_USD = 0.43;

interface ApiCost {
  accumulatedCost: number;
}

// Reads the accumulated cost from the file system
async function readAccumulatedCost(): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(COST_FILE_URI);
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(COST_FILE_URI, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const data: ApiCost = JSON.parse(content);
      return data.accumulatedCost || 0;
    }
  } catch (error) {
    console.error('Error reading API cost file:', error);
  }
  // Return 0 if file doesn't exist or there's an error
  return 0;
}

// Writes the updated cost to the file system
async function writeAccumulatedCost(cost: number): Promise<void> {
  try {
    const data: ApiCost = { accumulatedCost: cost };
    await FileSystem.writeAsStringAsync(COST_FILE_URI, JSON.stringify(data), {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (error) {
    console.error('Error writing API cost file:', error);
    // Decide how to handle write errors - maybe alert the user?
  }
}

// Calculates the cost of a single API call based on duration (assuming 6s units)
function calculateCallCost(durationSeconds: number): number {
    // For simplicity, assume every call generates at least 6 seconds worth of video
    // Adjust this logic if the API pricing is more granular or different
    const units = Math.max(1, Math.ceil(durationSeconds / 6));
    return units * COST_PER_6_SECONDS_USD;
}


// Checks if making another call would exceed the budget
async function canMakeApiCall(estimatedDurationSeconds: number): Promise<boolean> {
  const currentCost = await readAccumulatedCost();
  const callCost = calculateCallCost(estimatedDurationSeconds);
  const potentialTotalCost = currentCost + callCost;

  if (potentialTotalCost > MAX_COST_USD) {
    console.warn(`API Call blocked: Exceeds budget. Current: $${currentCost.toFixed(2)}, Call: $${callCost.toFixed(2)}, Limit: $${MAX_COST_USD.toFixed(2)}`);
    // Optionally: Trigger a user-facing alert here
    return false;
  }
  return true;
}

// Updates the accumulated cost after a successful API call
async function recordApiCallCost(durationSeconds: number): Promise<void> {
  const currentCost = await readAccumulatedCost();
  const callCost = calculateCallCost(durationSeconds);
  const newTotalCost = currentCost + callCost;
  await writeAccumulatedCost(newTotalCost);
  console.log(`API Cost Updated: Call Cost $${callCost.toFixed(2)}, Total Accumulated $${newTotalCost.toFixed(2)}`);
}

// Optional: Function to reset the cost (for testing or manual override)
async function resetApiCost(): Promise<void> {
    await writeAccumulatedCost(0);
    console.log("API cost tracking reset to $0.00");
}


export const CostTracker = {
  readAccumulatedCost,
  canMakeApiCall,
  recordApiCallCost,
  resetApiCost, // Export reset function if needed
  MAX_COST_USD,
}; 