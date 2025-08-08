"use client"

import { useState } from "react"
import { X, ZoomIn } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { parseImagePaths } from "@/lib/imageUpload"

interface JournalImageGalleryProps {
  images?: string
  className?: string
}

export default function JournalImageGallery({ images, className = "" }: JournalImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  
  // Add safety check for undefined images
  if (!images) return null
  
  const imagePaths = parseImagePaths(images)

  if (!imagePaths.length) return null

  return (
    <>
      <div className={`grid grid-cols-2 lg:grid-cols-3 gap-2 ${className}`}>
        {imagePaths.map((imagePath, index) => (
          <div key={index} className="relative group">
            <img
              src={imagePath}
              alt={`Journal image ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
              onClick={() => setSelectedImage(imagePath)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-4xl max-h-[90vh] w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Journal image full size"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}