import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import BannerCarousel from './BannerCarousel'

function LandingPage() {
  const { user, userData, loading, isEmailVerified, logout } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero Banner Section */}
      <BannerCarousel />

      {/* News and Announcements Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* News Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📰</span>
                </div>
                <h2 className="text-2xl font-bold text-red-800">NEWS</h2>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Announcements Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📢</span>
                </div>
                <h2 className="text-2xl font-bold text-red-800">ANNOUNCEMENT</h2>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
