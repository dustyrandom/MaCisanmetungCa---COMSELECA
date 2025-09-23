import { useEffect } from 'react'

function ImageModal({ src, alt, isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !src) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center" onClick={onClose}>
      <div className="mx-8 my-16" onClick={(e) => e.stopPropagation()}>
        {/* Shrink-wrap wrapper so the X aligns to image bounds exactly */}
        <div className="relative inline-block">
          <img
            src={src}
            alt={alt || 'Fullscreen view'}
            className="max-w-[90vw] max-w-2xl h-auto max-h-[calc(100vh-8rem)] object-contain rounded-lg"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-60 rounded-full p-2 shadow"
            aria-label="Close fullscreen view"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageModal
