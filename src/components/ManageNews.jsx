import { useState, useEffect } from 'react'
import { ref, get, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import AdminModal from './AdminModal'

function ManageNews() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'delete'
  const [selectedNews, setSelectedNews] = useState(null)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      const newsRef = ref(db, 'news')
      const snapshot = await get(newsRef)
      if (snapshot.exists()) {
        const newsData = snapshot.val()
        const newsList = Object.entries(newsData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.date) - new Date(a.date))
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
        // Update existing news
        const updateRef = ref(db, `news/${selectedNews.id}`)
        await update(updateRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Add new news
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage News</h1>
          <button
            onClick={openAddModal}
            className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            Add News
          </button>
        </div>


        {/* News List */}
        <div className="space-y-6">
          {news.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No news items yet. Add your first news item!</p>
            </div>
          ) : (
            news.map((newsItem) => (
              <div key={newsItem.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {newsItem.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(newsItem.date)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(newsItem)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(newsItem)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {newsItem.content}
                </p>
              </div>
            ))
          )}
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
      </div>
    </div>
  )
}

export default ManageNews
