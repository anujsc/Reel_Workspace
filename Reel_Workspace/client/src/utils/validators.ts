/**
 * Validates if a URL is a valid Instagram Reel or Post URL
 * @param url - The URL to validate
 * @returns true if valid Instagram reel/post URL, false otherwise
 */
export const validateInstagramUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") {
    return false;
  }

  // Regex to match Instagram reel or post URLs
  const instagramRegex = /instagram\.com\/(reel|p)\/[a-zA-Z0-9_-]+/;

  return instagramRegex.test(url);
};

/**
 * Extracts the reel/post ID from an Instagram URL
 * @param url - The Instagram URL
 * @returns The reel/post ID or null if invalid
 */
export const extractInstagramId = (url: string): string | null => {
  const match = url.match(/instagram\.com\/(reel|p)\/([a-zA-Z0-9_-]+)/);
  return match ? match[2] : null;
};
