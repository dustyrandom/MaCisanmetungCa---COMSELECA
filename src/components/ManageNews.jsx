import { useState, useEffect } from 'react'
import { ref, get, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import AdminModal from './AdminModal'
import { useAuth } from "../contexts/AuthContext"

function ManageNews() {
  const { userData } = useAuth()
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [selectedNews, setSelectedNews] = useState(null)

  useEffect(() => {
    if (userData?.role === 'admin' || userData?.role === 'superadmin') {
      fetchNews()
    } else {
      setLoading(false)
    }
  }, [userData])

  const fetchNews = async () => {
    try {
      const newsRef = ref(db, 'news')
      const snapshot = await get(newsRef)
      if (snapshot.exists()) {
        const newsData = snapshot.val()
        const newsList = Object.entries(newsData)
          .map(([id, data]) => ({
            id,
            ...data
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
        setNews(newsList)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching news:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const newsRef = ref(db, 'news')
      if (modalMode === 'edit' && selectedNews) {
        const updateRef = ref(db, `news/${selectedNews.id}`)
        await update(updateRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
      } else {
        await push(newsRef, {
          ...formData,
          createdAt: new Date().toISOString()
        })
      }
      fetchNews()
    } catch (error) {
      console.error('Error saving news:', error)
      throw error
    }
  }

  const handleEdit = (newsItem) => {
    setSelectedNews(newsItem)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleDelete = async () => {
    try {
      const newsRef = ref(db, `news/${selectedNews.id}`)
      await remove(newsRef)
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      throw error
    }
  }

  const openAddModal = () => {
    setSelectedNews(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const openDeleteModal = (newsItem) => {
    setSelectedNews(newsItem)
    setModalMode('delete')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedNews(null)
    setModalMode('add')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Access denied
  if (userData?.role !== 'admin' && userData?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-gray-200 p-10 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-3">Access Denied</h1>
            <p className="text-gray-600">
              You don’t have permission to access this page.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main className="pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-red-900">Manage News</h1>
            <button
              onClick={openAddModal}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
            >
              + Add News
            </button>
          </div>

          {/* News List */}
          <div className="space-y-6">
            {news.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 text-center">
                <p className="text-gray-500">No news items yet. Add your first news post!</p>
              </div>
            ) : (
              news.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{newsItem.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(newsItem.date)}</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(newsItem)}
                        className="text-amber-500 hover:text-amber-600 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => openDeleteModal(newsItem)}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {newsItem.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Admin Modal */}
        <AdminModal
          isOpen={modalOpen}
          onClose={closeModal}
          mode={modalMode}
          type="news"
          initialData={selectedNews}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}

export default ManageNews
