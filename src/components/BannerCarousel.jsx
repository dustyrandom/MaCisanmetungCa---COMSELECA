import { useState, useEffect } from 'react'
import banner1 from '../assets/banner/banner.png'
import banner2 from '../assets/banner/banner2.png'
import banner3 from '../assets/banner/banner3.png'
import banner4 from '../assets/banner/banner4.png'


function BannerCarousel() {
  const banners = [
    { src: banner1, alt: 'Student Elections 2025 Banner 1' },
    { src: banner2, alt: 'Student Elections 2025 Banner 2' },
    { src: banner3, alt: 'Student Elections 2025 Banner 3' },
    { src: banner4, alt: 'Student Elections 2025 Banner 4' }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  useEffect(() => {
    if (!isAutoRotating) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length, isAutoRotating])

  const goToSlide = (index) => {
    setCurrentIndex(index)
    setIsAutoRotating(false)
    setTimeout(() => {
      setIsAutoRotating(true)
    }, 8000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length)
    // Pause auto-rotation for 8 seconds when user manually navigates
    setIsAutoRotating(false)
    setTimeout(() => {
      setIsAutoRotating(true)
    }, 8000)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    // Pause auto-rotation for 8 seconds when user manually navigates
    setIsAutoRotating(false)
    setTimeout(() => {
      setIsAutoRotating(true)
    }, 8000)
  }

  return (
    <div className="relative bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg">
          <div className="relative">
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`transition-opacity duration-500 ${
                  index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
                }`}
              >
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Previous banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
            aria-label="Next banner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BannerCarousel
