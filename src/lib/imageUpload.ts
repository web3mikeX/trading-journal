// Client-side utility functions for image handling
export function formatImagePaths(imagePaths: string[]): string {
  return imagePaths.join(',')
}

export function parseImagePaths(imagesString: string | null): string[] {
  if (!imagesString) return []
  return imagesString.split(',').filter(path => path.trim())
}