import { useState, useEffect } from 'react'

function AdminModal({ 
  isOpen, 
  onClose, 
  mode, 
  type, 
  initialData = null, 
  onSubmit, 
  onDelete 
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        date: initialData.date || new Date().toISOString().split('T')[0]
      })
    } else if (isOpen && !initialData) {
      setFormData({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [isOpen, initialData])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      setLoading(true)
      try {
        await onDelete()
        onClose()
      } catch (error) {
        console.error('Error deleting item:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const getTypeIcon = (type) => {
    return type === 'news' ? '📰' : '📢'
  }

  const getTypeColor = (type) => {
    return type === 'news' ? 'text-blue-800' : 'text-red-800'
  }

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return `Add New ${type === 'news' ? 'News' : 'Announcement'}`
      case 'edit':
        return `Edit ${type === 'news' ? 'News' : 'Announcement'}`
      case 'delete':
        return `Delete ${type === 'news' ? 'News' : 'Announcement'}`
      default:
        return ''
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative bg-white rounded-lg shadow-xl w-full overflow-hidden ${
          mode === 'delete' ? 'max-w-md' : 'max-w-2xl'
        } max-h-[90vh]`}>
          {/* Header */}
          <div className={`flex items-center justify-between border-b border-gray-200 ${
            mode === 'delete' ? 'p-4' : 'p-6'
          }`}>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getTypeIcon(type)}</span>
              <h2 className={`text-xl font-bold ${getTypeColor(type)}`}>
                {getModalTitle()}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className={`overflow-y-auto max-h-[calc(90vh-120px)] ${
            mode === 'delete' ? 'p-4' : 'p-6'
          }`}>
            {mode === 'delete' ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete "{initialData?.title}"?
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                    disabled={loading}
                  />
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className={`flex justify-end space-x-3 border-t border-gray-200 bg-gray-50 ${
            mode === 'delete' ? 'p-4' : 'p-6'
          }`}>
            {mode === 'delete' ? (
              <>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-red-900 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Add')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminModal
