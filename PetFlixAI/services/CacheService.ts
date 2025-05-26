import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

// Cache configuration
const videoCacheDir = FileSystem.cacheDirectory + 'videoCache/';
const videoCacheMetadataFile = videoCacheDir + 'metadata.json';

export const ensureCacheDirExists = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(videoCacheDir);
  if (!dirInfo.exists) {
    console.log("Creating video cache directory:", videoCacheDir);
    await FileSystem.makeDirectoryAsync(videoCacheDir, { intermediates: true });
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
  } else {
    const fileInfo = await FileSystem.getInfoAsync(videoCacheMetadataFile);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
    }
  }
};

export const readCacheMetadata = async (): Promise<{ [key: string]: string }> => {
  try {
    await ensureCacheDirExists();
    const metadataString = await FileSystem.readAsStringAsync(videoCacheMetadataFile, { encoding: FileSystem.EncodingType.UTF8 });
    return JSON.parse(metadataString);
  } catch (error) {
    console.error("Failed to read video cache metadata:", error);
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify({}), { encoding: FileSystem.EncodingType.UTF8 });
    return {};
  }
};

export const writeCacheMetadata = async (metadata: { [key: string]: string }): Promise<void> => {
  try {
    await ensureCacheDirExists();
    await FileSystem.writeAsStringAsync(videoCacheMetadataFile, JSON.stringify(metadata, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
  } catch (error) {
    console.error("Failed to write video cache metadata:", error);
  }
};

export const generateCacheKey = async (imageUri: string, themeId: string): Promise<string> => {
  const inputString = `${imageUri}-${themeId}`;
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, inputString);
};

export const checkCache = async (imageUri: string, themeId: string): Promise<{ cacheKey: string | null, cachedUrl: string | null }> => {
  let cacheKey: string | null = null;
  try {
    cacheKey = await generateCacheKey(imageUri, themeId);
    const metadata = await readCacheMetadata();
    if (metadata[cacheKey]) {
      console.log(`Cache hit for key ${cacheKey}. Returning cached URL: ${metadata[cacheKey]}`);
      return { cacheKey, cachedUrl: metadata[cacheKey] };
    }
    console.log(`Cache miss for key ${cacheKey}. Proceeding with generation.`);
    return { cacheKey, cachedUrl: null };
  } catch (cacheError) {
    console.error("Error checking video cache:", cacheError);
    return { cacheKey: null, cachedUrl: null };
  }
};

export const cacheResult = async (cacheKey: string | null, videoUrl: string | undefined): Promise<void> => {
  if (cacheKey && videoUrl) {
    try {
      const metadata = await readCacheMetadata();
      metadata[cacheKey] = videoUrl;
      await writeCacheMetadata(metadata);
      console.log(`Cached video URL for key ${cacheKey}: ${videoUrl}`);
    } catch (cacheError) {
      console.error("Error writing to video cache:", cacheError);
    }
  }
};

export const encodeImageAsDataUri = async (imageUri: string): Promise<string> => {
  try {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const extension = imageUri.split('.').pop()?.toLowerCase();
    let mimeType = 'image/jpeg';
    if (extension === 'png') {
      mimeType = 'image/png';
    }
    return `data:${mimeType};base64,${base64Image}`;
  } catch (imgError) {
    console.error("Error reading/encoding image:", imgError);
    throw new Error("Failed to load or encode image");
  }
}; 