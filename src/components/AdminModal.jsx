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
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => (document.body.style.overflow = 'unset')
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose()
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
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
    try {
      await onDelete()
      onClose()
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setLoading(false)
    }
  }

  /* const getTypeIcon = (type) => (type === 'news' ? '📰' : '📢') */
  const getTypeColor = (type) => (type === 'news' ? 'text-gray-900' : 'text-gray-800')

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return `Add ${type === 'news' ? 'News' : 'Announcement'}`
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out scale-100 animate-fadeIn
        ${mode === 'delete' ? 'max-w-md' : 'max-w-2xl'} w-full overflow-hidden`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white
          ${mode === 'delete' ? 'p-5' : 'p-6'}`}
        >
          <div className="flex items-center space-x-3">
            {/* <span className="text-3xl">{getTypeIcon(type)}</span> */}
            <h2 className={`text-2xl font-semibold tracking-tight ${getTypeColor(type)}`}>
              {getModalTitle()}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto max-h-[calc(90vh-130px)] ${mode === 'delete' ? 'p-5' : 'p-6'}`}>
          {mode === 'delete' ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-100 shadow-inner">
                <svg
                  className="h-7 w-7 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-700">
                Delete "<span className='text-gray-900'>{initialData?.title}</span>”?
              </h3>
              <p className="text-sm sm:text-base text-gray-500">
                This action cannot be undone.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                  placeholder="Enter title"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition resize-none"
                  placeholder="Write your content here..."
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                  required
                  disabled={loading}
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex justify-end space-x-3 border-t border-gray-200 bg-gray-50
          ${mode === 'delete' ? 'p-5' : 'p-6'}`}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>

          {mode === 'delete' ? (
            <button
              onClick={handleDelete}
              className="px-5 py-2.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className={`px-5 py-2.5 font-medium rounded-lg text-white transition disabled:opacity-50
                ${mode === 'edit'
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-400'
                  : 'bg-green-600 hover:bg-green-700 focus:ring-green-400'
                }`}
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminModal
