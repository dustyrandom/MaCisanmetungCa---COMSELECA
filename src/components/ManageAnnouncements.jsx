import { useState, useEffect } from 'react'
import { ref, get, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import AdminModal from './AdminModal'
import { useAuth } from "../contexts/AuthContext"

function ManageAnnouncements() {
  const { userData } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add', 'edit', 'delete'
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchAnnouncements()
    } else {
      setLoading(false) // stop loader if not admin
    }
  }, [userData])

  const fetchAnnouncements = async () => {
    try {
      const announcementsRef = ref(db, 'announcements')
      const snapshot = await get(announcementsRef)
      if (snapshot.exists()) {
        const announcementsData = snapshot.val()
        const announcementsList = Object.entries(announcementsData).map(([id, data]) => ({
          id,
          ...data
        })).sort((a, b) => new Date(b.date) - new Date(a.date))
        setAnnouncements(announcementsList)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching announcements:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const announcementsRef = ref(db, 'announcements')
      
      if (modalMode === 'edit' && selectedAnnouncement) {
        // Update existing announcement
        const updateRef = ref(db, `announcements/${selectedAnnouncement.id}`)
        await update(updateRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        })
      } else {
        // Add new announcement
        await push(announcementsRef, {
          ...formData,
          createdAt: new Date().toISOString()
        })
      }
      
      fetchAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      throw error
    }
  }

  const handleEdit = (announcement) => {
    setSelectedAnnouncement(announcement)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleDelete = async () => {
    try {
      const announcementRef = ref(db, `announcements/${selectedAnnouncement.id}`)
      await remove(announcementRef)
      fetchAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      throw error
    }
  }

  const openAddModal = () => {
    setSelectedAnnouncement(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const openDeleteModal = (announcement) => {
    setSelectedAnnouncement(announcement)
    setModalMode('delete')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedAnnouncement(null)
    setModalMode('add')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (userData?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Announcements</h1>
          <button
            onClick={openAddModal}
            className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
          >
            Add Announcement
          </button>
        </div>


        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">No announcements yet. Add your first announcement!</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(announcement.date)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(announcement)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {announcement.content}
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
          type="announcement"
          initialData={selectedAnnouncement}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

export default ManageAnnouncements
