import { useState, useEffect } from 'react'
import { ref, get, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import { useAuth } from '../contexts/AuthContext'
import { logActivity } from '../utils/logActivity'

const CAROUSEL_HEIGHT = '350px'

function ManageBanner() {
  const { userData } = useAuth()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState('add')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (userData?.role === 'admin' || userData?.role === 'superadmin') {
      fetchBanners()
    } else {
      setLoading(false)
    }
  }, [userData])

  const fetchBanners = async () => {
    try {
      const bannerRef = ref(db, 'carousel')
      const snapshot = await get(bannerRef)
      if (snapshot.exists()) {
        const data = snapshot.val()
        const list = Object.entries(data).map(([id, data]) => ({ id, ...data }))
        setBanners(list)
      }
      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const openAdd = () => {
    setMode('add')
    setSelected(null)
    setImageFile(null)
    setPreview(null)
    setModalOpen(true)
  }

  const openEdit = (banner) => {
    setMode('edit')
    setSelected(banner)
    setPreview(banner.url)
    setModalOpen(true)
  }

  const openDelete = (banner) => {
    setMode('delete')
    setSelected(banner)
    setModalOpen(true)
  }

  const handleUpload = async () => {
    if (!imageFile) return alert('Please select an image.')
    if (isProcessing) return;
    try {
      const bannerRef = ref(db, 'carousel')

      // Convert file to base64
      const fileReader = new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(imageFile)
      })

      const base64 = await fileReader

      if (mode === 'add') {
        await push(bannerRef, { url: base64 })
        await logActivity(userData.fullName, 'Added new banner image')
      } else if (mode === 'edit') {
        await update(ref(db, `carousel/${selected.id}`), { url: base64 })
        await logActivity(userData.fullName, 'Updated a banner image')
      }

      fetchBanners()
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (isProcessing) return;
    // Minimum 3 images required
    if (banners.length <= 3) {
      alert('You must keep at least 3 banner images.')
      return
    }

    try {
      await remove(ref(db, `carousel/${selected.id}`))
      await logActivity(userData.fullName, 'Deleted a banner image')
      fetchBanners()
      setModalOpen(false)
    } catch (err) {
      console.error(err)
    }
  }

  if (userData?.role !== 'admin' && userData?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-24 px-4 sm:px-6 lg:px-8 flex justify-center">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-10 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-3">Access Denied</h1>
            <p className="text-gray-600">You don’t have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-4xl mx-auto pt-24 px-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
  <div className="min-h-screen bg-gray-50">
    <NavBar />
    <div className="pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-red-900">Manage Banner</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Update the carousel images on the landing page.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 text-sm sm:text-base rounded-lg w-15 w-20 bg-green-600 text-white font-medium hover:bg-green-700 transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* BANNER LIST — Now positioned EXACTLY like Manage News */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all p-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
              <th className="py-3 px-4 text-left text-gray-700 font-semibold text-sm">
                Banner
              </th>
              <th className="py-3 px-4 text-center text-gray-700 font-semibold text-sm w-32">
                Actions
              </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {banners.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <img
                      src={item.url}
                      className="rounded-lg object-cover border"
                      style={{ width: "120px", height: "90px" }}
                    />
                  </td>

                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openDelete(item)}
                        disabled={banners.length <= 3}
                        className={`font-medium transition-colors ${
                          banners.length <= 3
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-700"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>

    </div>

    {/* Modals stay the same */}
    {modalOpen && (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">

          {(mode === "add" || mode === "edit") && (
            <>
              <h2 className="text-xl font-bold mb-4">
                {mode === "add" ? "Add Banner" : "Edit Banner"}
              </h2>

              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="mb-4 text-sm text-gray-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className={`bg-green-600 text-white px-4 py-2 rounded-lg font-medium ${
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
                }`}
                >
                    {isProcessing ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}

          {mode === "delete" && (
            <>
              <h2 className="text-xl font-bold mb-4 text-red-700">Delete Banner</h2>

              {banners.length <= 3 ? (
                <p className="text-red-600 font-medium mb-4">
                  You must keep at least 3 banner images.
                </p>
              ) : (
                <p className="mb-4">Are you sure you want to delete this banner?</p>
              )}

              <div className="flex justify-end space-x-3 mt-4">
                <button onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg">
                  Cancel
                </button>

                <button
                  onClick={handleDelete}
                  disabled={banners.length <= 3}
                  className={`px-4 py-2 rounded-lg text-white font-medium ${
                  banners.length <= 3
                    ? "bg-gray-400 cursor-not-allowed"
                    : isProcessing
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                >
                  {isProcessing ? "Deleting..." : "Delete"}
                </button>
              </div>

            </>
          )}
        </div>
      </div>
    )}

  </div>
)

}

export default ManageBanner
