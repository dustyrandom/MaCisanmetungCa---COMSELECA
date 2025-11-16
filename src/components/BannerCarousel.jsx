import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { db } from '../firebase'

function BannerCarousel() {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)

  // Load banners from Firebase (connected to ManageBanner)
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const bannerRef = ref(db, "carousel")
        const snapshot = await get(bannerRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          const list = Object.entries(data).map(([id, banner]) => ({
            src: banner.url,
            alt: `Banner ${id}`,
          }))
          setBanners(list)
        }
      } catch (error) {
        console.error("Error loading banners:", error)
      }
    }

    fetchBanners()
  }, [])

  // Auto-rotate logic
  useEffect(() => {
    if (!isAutoRotating || banners.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners, isAutoRotating])

  const goToSlide = (index) => {
    setCurrentIndex(index)
    pauseAuto()
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
    pauseAuto()
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
    pauseAuto()
  }

  const pauseAuto = () => {
    setIsAutoRotating(false)
    setTimeout(() => setIsAutoRotating(true), 8000)
  }

  return (
    <div className="relative bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl shadow-md bg-white">

          <div className="relative">
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`transition-opacity duration-500 ${
                  index === currentIndex
                    ? 'opacity-100'
                    : 'opacity-0 absolute inset-0'
                }`}
              >
                <img
                  src={banner.src}
                  alt={banner.alt}
                  className="
                    w-full 
                    h-[300px] 
                    sm:h-[350px] 
                    md:h-[400px] 
                    lg:h-[436px] 
                    object-contain 
                    rounded-lg
                  "
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BannerCarousel
