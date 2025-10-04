import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ref as dbRef, set, update } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { updateProfile } from 'firebase/auth'
import { db, storage, auth } from '../firebase'
import NavBar from './NavBar'

function Profile() {
  const { user, userData } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    studentId: '',
    institute: '',
    email: ''
  })
  /* const [profilePicture, setProfilePicture] = useState(null) */
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.fullName || '',
        studentId: userData.studentId || '',
        institute: userData.institute || '',
        email: userData.email || ''
      })
      setProfilePictureUrl(userData.profilePicture || '')
    }
  }, [userData])

  /*  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  } */

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB')
        return
      }
      
      uploadProfilePicture(file) // auto-upload immediately
      setError('')
    }
  }

  const uploadProfilePicture = async (file) => {
    if (!file) return null
    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Delete old profile picture if exists
      if (userData?.profilePicture) {
        try {
          const oldImageRef = storageRef(storage, userData.profilePicture)
          await deleteObject(oldImageRef)
        } catch (error) {
          console.warn('Could not delete old profile picture:', error)
        }
      }

      // Upload new profile picture
      const imageRef = storageRef(storage, `profile-pictures/${user.uid}/${Date.now()}`)
      const snapshot = await uploadBytes(imageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      const userRef = dbRef(db, `users/${user.uid}`)
      await update(userRef, {
        profilePicture: downloadURL,
        updatedAt: new Date().toISOString()
      })

      setProfilePictureUrl(downloadURL)
      setMessage('Profile picture updated successfully!')
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      setError('Failed to upload profile picture. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /* const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
    // 🔹 Update Firebase Auth displayName
    await updateProfile(auth.currentUser, {
      displayName: formData.fullName
    })

    // 🔹 Update Realtime Database
    const userRef = dbRef(db, `users/${user.uid}`)
    await update(userRef, {
      fullName: formData.fullName,
      studentId: formData.studentId,
      institute: formData.institute,
      updatedAt: new Date().toISOString()
    })

      setMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  } */

  const removeProfilePicture = async () => {
    if (!profilePictureUrl) return

    setLoading(true)
    setError('')

    try {
      // Delete from storage
      const imageRef = storageRef(storage, profilePictureUrl)
      await deleteObject(imageRef)

      // Update database
      const userRef = dbRef(db, `users/${user.uid}`)
      await update(userRef, {
        profilePicture: null,
        updatedAt: new Date().toISOString()
      })

      setProfilePictureUrl('')
      setMessage('Profile picture removed successfully!')

    } catch (error) {
      console.error('Error removing profile picture:', error)
      setError('Failed to remove profile picture. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Management</h1>
            
            <div className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative h-24 w-24">
                    {profilePictureUrl ? (
                      <img
                        className="h-24 w-24 rounded-full object-cover border-4 border-gray-200"
                        src={profilePictureUrl}
                        alt="Profile"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-red-900 text-white flex items-center justify-center text-2xl font-bold border-4 border-gray-200">
                        {(formData.fullName || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* 🔹 Spinner Overlay */}
                    {loading && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
                        <svg className="animate-spin h-8 w-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Picture
                      </label>
                      <input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                    {profilePictureUrl && (
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        disabled={loading}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  /*onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  */
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Student ID Field */}
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  /*onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  */
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Institute Field */}
              <div>
                <label htmlFor="institute" className="block text-sm font-medium text-gray-700 mb-2">
                  Institute
                </label>
                <input
                  id="institute"
                  name="institute"
                  value={formData.institute}
                  /*
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  */
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                >
                  {/*
                  <option value="">Select Institute</option>
                  <option value="Institute of Arts and Sciences">Institute of Arts and Sciences</option>
                  <option value="Institute of Business and Computing Education">Institute of Business and Computing Education</option>
                  <option value="Institute of Teacher Education">Institute of Teacher Education</option>
                  <option value="Institute of Hospitality and Tourism Management">Institute of Hospitality and Tourism Management</option>
                  */}
                </input>
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  disabled
                />
              </div>

              <p className="mt-1 text-xs text-gray-500">Credentials cannot be changed. Contact the commission if needed.</p>

              {/* Messages */}
              {message && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {message}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              
              {/* <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-900 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
              </div> */}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile
