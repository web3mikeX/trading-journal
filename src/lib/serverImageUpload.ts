import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function saveImages(images: File[]): Promise<string[]> {
  if (!images || images.length === 0) return []

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), 'public', 'uploads', 'journal')
  await mkdir(uploadsDir, { recursive: true })

  const savedPaths: string[] = []

  for (const image of images) {
    try {
      // Generate unique filename using timestamp and random number
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 15)
      const fileExtension = image.name.split('.').pop() || 'jpg'
      const fileName = `${timestamp}_${random}.${fileExtension}`
      const filePath = join(uploadsDir, fileName)
      
      // Convert File to Buffer
      const bytes = await image.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Save file
      await writeFile(filePath, buffer)
      
      // Store relative path for database
      savedPaths.push(`/uploads/journal/${fileName}`)
    } catch (error) {
      console.error('Error saving image:', error)
      // Continue with other images even if one fails
    }
  }

  return savedPaths
}

export function formatImagePaths(imagePaths: string[]): string {
  return imagePaths.join(',')
}