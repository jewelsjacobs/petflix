/**
 * Reference images configuration for Vidu API
 * These images are stored locally and can be reused for multiple requests
 */

import { Asset } from 'expo-asset';

export interface ReferenceImage {
  id: string;
  name: string;
  description: string;
  path: any; // Asset require path
  category?: string;
}

// Import your reference images here
// Example imports (uncomment and replace with your actual images):
// @ts-ignore
import frogDragonImg from '../assets/reference-images/frog-dragon.png';
// @ts-ignore
import leafImg from '../assets/reference-images/leaf.png';

// Define your reference images here
export const REFERENCE_IMAGES: Record<string, ReferenceImage> = {
  // Example reference images - uncomment and use your actual imported images

  FROG_DRAGON: {
    id: 'frog_dragon',
    name: 'Frog Dragon',
    description: 'A friendly frog dragon',
    path: frogDragonImg,
  },
  LEAF: {
    id: 'leaf', 
    name: 'Leaf',
    description: 'An iridescent leaf',
    path: leafImg,
  },
};

/**
 * Resolves the asset path to a local URI
 * @param assetPath - The asset require path
 * @returns Local file URI
 */
export const resolveAssetPath = async (assetPath: any): Promise<string> => {
  const asset = Asset.fromModule(assetPath);
  await asset.downloadAsync();
  return asset.localUri || asset.uri;
};

// Helper function to get image by ID
export const getReferenceImageById = (imageId: string): ReferenceImage | undefined => {
  return Object.values(REFERENCE_IMAGES).find(img => img.id === imageId);
};
 