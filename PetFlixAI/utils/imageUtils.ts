import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Validates and prepares an image to meet Vidu API requirements
 * @param imageUri - Local file URI (e.g., file:///...)
 * @returns Processed image URI that meets all requirements
 */
async function validateAndPrepareImage(imageUri: string): Promise<string> {
  try {
    // Get image info
    // TODO: Update to new ImageManipulator API when types are fixed
    // @ts-ignore - Using deprecated API until new API is properly typed
    const imageInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );

    let { width, height } = imageInfo;
    console.log(`Original image dimensions: ${width}x${height}`);

    // Calculate aspect ratio
    const aspectRatio = width / height;
    console.log(`Original aspect ratio: ${aspectRatio.toFixed(2)}`);

    // Check if we need to resize
    let needsResize = false;
    let newWidth = width;
    let newHeight = height;

    // Check minimum dimensions (128x128)
    if (width < 128 || height < 128) {
      const scale = Math.max(128 / width, 128 / height);
      newWidth = Math.ceil(width * scale);
      newHeight = Math.ceil(height * scale);
      needsResize = true;
      console.log(`Image too small, scaling up to: ${newWidth}x${newHeight}`);
    }

    // Check aspect ratio (must be between 1:4 and 4:1)
    if (aspectRatio > 4) {
      // Too wide, crop width
      newWidth = Math.floor(newHeight * 4);
      needsResize = true;
      console.log(`Image too wide, cropping to: ${newWidth}x${newHeight}`);
    } else if (aspectRatio < 0.25) {
      // Too tall, crop height
      newHeight = Math.floor(newWidth * 4);
      needsResize = true;
      console.log(`Image too tall, cropping to: ${newWidth}x${newHeight}`);
    }

    // Process image if needed
    let processedUri = imageUri;
    if (needsResize) {
      // @ts-ignore - Using deprecated API until new API is properly typed
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { 
          compress: 0.8, // Compress to reduce file size
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );
      processedUri = manipResult.uri;
      console.log(`Image resized to meet requirements`);
    }

    // Check file size
    const fileInfo = await FileSystem.getInfoAsync(processedUri);
    if (fileInfo.exists && 'size' in fileInfo) {
      const sizeMB = fileInfo.size / (1024 * 1024);
      console.log(`Image file size: ${sizeMB.toFixed(2)}MB`);
      
      if (sizeMB > 50) {
        // Compress more aggressively
        console.log('Image too large, compressing...');
        // @ts-ignore - Using deprecated API until new API is properly typed
        const compressedResult = await ImageManipulator.manipulateAsync(
          processedUri,
          [],
          { 
            compress: 0.5, // More aggressive compression
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        processedUri = compressedResult.uri;
        
        // Check size again
        const compressedInfo = await FileSystem.getInfoAsync(processedUri);
        if (compressedInfo.exists && 'size' in compressedInfo) {
          const compressedSizeMB = compressedInfo.size / (1024 * 1024);
          if (compressedSizeMB > 50) {
            throw new Error(`Image still too large after compression: ${compressedSizeMB.toFixed(2)}MB`);
          }
        }
      }
    }

    return processedUri;
  } catch (error) {
    console.error('Error validating/preparing image:', error);
    throw new Error(`Failed to prepare image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Converts a local image URI to base64 format suitable for Vidu API
 * @param imageUri - Local file URI (e.g., file:///...)
 * @returns Base64 string with content type prefix (e.g., "image/png;base64,...")
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    // First validate and prepare the image
    const processedUri = await validateAndPrepareImage(imageUri);
    
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(processedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get file extension to determine MIME type
    const extension = processedUri.split('.').pop()?.toLowerCase() || '';
    let mimeType = 'image/jpeg'; // default

    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        console.warn(`Unknown image extension: ${extension}, defaulting to image/jpeg`);
    }

    // Return in the format required by Vidu API
    // Try standard data URI format: "data:image/png;base64,{base64_encode}"
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if an image URI is a local file or a remote URL
 * @param uri - Image URI to check
 * @returns true if it's a local file, false if it's a remote URL
 */
export function isLocalFileUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
} 