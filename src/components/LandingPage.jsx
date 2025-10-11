import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ref, get } from 'firebase/database'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import NavBar from './NavBar'
import BannerCarousel from './BannerCarousel'
import ContentModal from './ContentModal'

function LandingPage() {
  const { user, userData, loading, isEmailVerified, logout } = useAuth()
  const [news, setNews] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [contentLoading, setContentLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState(null)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      // Fetch news
      const newsRef = ref(db, 'news')
      const newsSnapshot = await get(newsRef)
      let newsData = []
      if (newsSnapshot.exists()) {
        newsData = Object.entries(newsSnapshot.val())
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3) // Show only latest 3 news items
      }

      // Fetch announcements
      const announcementsRef = ref(db, 'announcements')
      const announcementsSnapshot = await get(announcementsRef)
      let announcementsData = []
      if (announcementsSnapshot.exists()) {
        announcementsData = Object.entries(announcementsSnapshot.val())
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 3) // Show only latest 3 announcements
      }

      setNews(newsData)
      setAnnouncements(announcementsData)
      setContentLoading(false)
    } catch (error) {
      console.error('Error fetching content:', error)
      setContentLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const openModal = (item, type) => {
    setModalContent({ ...item, type })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalContent(null)
  }

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
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        {/* Hero Banner Section */}
        <BannerCarousel />

      {/* News and Announcements Section */}
      <section className="py-8 sm:py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* News Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📰</span>
                </div>
                <h2 className="text-2xl font-bold text-red-800">NEWS</h2>
              </div>
              {contentLoading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ) : news.length === 0 ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((newsItem) => (
                    <div 
                      key={newsItem.id} 
                      className="border-l-4 border-red-800 pl-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => openModal(newsItem, 'news')}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {newsItem.title}
                      </h3>
                      <p className="text-gray-600 text-xs mb-1 line-clamp-3">
                        {newsItem.content}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatDate(newsItem.date)}
                      </p>
                      <p className="text-blue-600 text-xs mt-1 font-medium">
                        Click to read more →
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Announcements Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📢</span>
                </div>
                <h2 className="text-2xl font-bold text-red-800">ANNOUNCEMENT</h2>
              </div>
              {contentLoading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div 
                      key={announcement.id} 
                      className="border-l-4 border-red-800 pl-4 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                      onClick={() => openModal(announcement, 'announcement')}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {announcement.title}
                      </h3>
                      <p className="text-gray-600 text-xs mb-1 line-clamp-3">
                        {announcement.content}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatDate(announcement.date)}
                      </p>
                      <p className="text-blue-600 text-xs mt-1 font-medium">
                        Click to read more →
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      </div>
      {/* Content Modal */}
      {modalContent && (
        <ContentModal
          isOpen={modalOpen}
          onClose={closeModal}
          title={modalContent.title}
          content={modalContent.content}
          date={modalContent.date}
          type={modalContent.type}
        />
      )}
    </div>
  )
}

export default LandingPage
