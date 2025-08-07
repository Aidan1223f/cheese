import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
  format: string;
}

/**
 * Process and compress an image for API upload
 */
export async function processImageForAnalysis(
  imageUri: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  try {
    // Get image info first
    const imageInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // no operations yet
      {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    // Calculate resize dimensions while maintaining aspect ratio
    const { width, height } = calculateResizeDimensions(
      imageInfo.width,
      imageInfo.height,
      maxWidth,
      maxHeight
    );

    // Process the image
    const processedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width,
            height,
          },
        },
      ],
      {
        compress: quality,
        format: getSaveFormat(format),
      }
    );

    // Get file size (approximate)
    const fileSize = await getFileSize(processedImage.uri);

    return {
      uri: processedImage.uri,
      width: processedImage.width,
      height: processedImage.height,
      size: fileSize,
      format: format,
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate resize dimensions while maintaining aspect ratio
 */
function calculateResizeDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Resize if image is too large
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Convert format string to ImageManipulator SaveFormat
 */
function getSaveFormat(format: string): ImageManipulator.SaveFormat {
  switch (format.toLowerCase()) {
    case 'png':
      return ImageManipulator.SaveFormat.PNG;
    case 'webp':
      return ImageManipulator.SaveFormat.WEBP;
    case 'jpeg':
    default:
      return ImageManipulator.SaveFormat.JPEG;
  }
}

/**
 * Get file size in bytes (approximate)
 */
async function getFileSize(uri: string): Promise<number> {
  try {
    if (Platform.OS === 'web') {
      // For web, we can't easily get file size without fetching
      return 0; // Return 0 for web platform
    }

    // For native platforms, we can use the file system
    // This is a simplified implementation
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.warn('Could not determine file size:', error);
    return 0;
  }
}

/**
 * Validate image before processing
 */
export function validateImage(imageUri: string): boolean {
  if (!imageUri) {
    return false;
  }

  // Check if it's a valid image URL or file path
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const lowerUri = imageUri.toLowerCase();
  
  return validExtensions.some(ext => lowerUri.includes(ext)) || 
         lowerUri.startsWith('data:image/') ||
         lowerUri.startsWith('file://') ||
         lowerUri.startsWith('http');
}

/**
 * Convert image to base64 for API upload
 */
export async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image to base64');
  }
}

/**
 * Generate a unique filename for processed images
 */
export function generateImageFilename(prefix: string = 'processed'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}.jpg`;
}

/**
 * Check if image size is within acceptable limits
 */
export function isImageSizeAcceptable(fileSize: number, maxSize: number = 5 * 1024 * 1024): boolean {
  return fileSize <= maxSize;
}

/**
 * Get image dimensions without processing
 */
export async function getImageDimensions(imageUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = reject;
    img.src = imageUri;
  });
} 