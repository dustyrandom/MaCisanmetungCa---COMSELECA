import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ref as dbRef, update } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
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
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showChangePassword, setShowChangePassword] = useState(false)

  // Password modal states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordsMatch, setPasswordsMatch] = useState(null);

  useEffect(() => {
    if (!confirmPassword && !newPassword) {
      setPasswordsMatch(null); // neutral initially
    } else if (!confirmPassword) {
      setPasswordsMatch(null);
    } else {
      setPasswordsMatch(newPassword === confirmPassword);
    }
  }, [newPassword, confirmPassword]);

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

  const handleProfilePictureChange = async (e) => {
  const file = e.target.files[0];
    if (!file) return;

    setError('');
    setMessage('');

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB.');
      return;
    }

    await uploadProfilePicture(file);
  };

  const uploadProfilePicture = async (file) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      //Remove old picture from Firebase Storage if it exists
      if (userData?.profilePicture) {
        const oldRef = storageRef(storage, userData.profilePicture);
        await deleteObject(oldRef).catch(() => {});
      }

      //Upload new file
      const imageRef = storageRef(storage, `profile-pictures/${user.uid}/${Date.now()}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      //Update database record
      const userRef = dbRef(db, `users/${user.uid}`);
      await update(userRef, {
        profilePicture: downloadURL,
        updatedAt: new Date().toISOString(),
      });

      //Update UI instantly
      setProfilePictureUrl(downloadURL);
      setMessage('Profile picture updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to upload profile picture.');
    } finally {
      setLoading(false);
    }
  };

  const removeProfilePicture = async () => {
    if (!profilePictureUrl) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      //Delete from Firebase Storage
      const imgRef = storageRef(storage, profilePictureUrl);
      await deleteObject(imgRef).catch(() => {});

      //Remove from database
      const userRef = dbRef(db, `users/${user.uid}`);
      await update(userRef, { profilePicture: null, updatedAt: new Date().toISOString() });

      //Clear local UI
      setProfilePictureUrl('');
      setMessage('Profile picture removed successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to remove profile picture.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Password change logic
  const checkPasswordRules = (password) => {
    setPasswordRules({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password)
    })
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordMessage('')
    if (newPassword !== confirmPassword)
      return setPasswordMessage('Passwords do not match.')
    if (!Object.values(passwordRules).every(Boolean))
      return setPasswordMessage('Password does not meet all requirements.')

    try {
      setPasswordLoading(true)
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      setPasswordMessage('Password changed successfully!')
      setTimeout(() => setShowChangePassword(false), 2000)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error(err)
      setPasswordMessage('Failed to change password. Check your current password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const resetPasswordFields = () => {
  setCurrentPassword('');
  setNewPassword('');
  setConfirmPassword('');
  setPasswordsMatch(null);
  setError('');
  setMessage('');

  // reset progress bar / password strength
  setPasswordRules({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  setShowCurrentPassword(false);
  setShowPassword(false);
  setShowConfirmPassword(false);
};



  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-red-900 mb-6">Profile Management</h1>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0 relative h-24 w-24">
                  {profilePictureUrl ? (
                    <img src={profilePictureUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-red-900 text-white flex items-center justify-center text-2xl font-bold border-4 border-gray-200">
                      {(formData.fullName || 'U').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center">
                      <svg className="animate-spin h-8 w-8 text-red-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="block w-full text-sm text-gray-500 file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF. Max 5MB.</p>
                    </div>
                    {profilePictureUrl && (
                      <button
                        onClick={removeProfilePicture}
                        disabled={loading}
                        className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Fields */}
              {['fullName', 'studentId', 'institute', 'email'].map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={formData[field]}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              ))}

              <p className="mt-1 text-xs text-gray-500">Credentials cannot be changed. Contact the commission if needed.</p>

              {/* Change Password Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="px-5 py-3 text-sm font-medium text-white bg-red-800 rounded-lg hover:bg-red-900"
                >
                  Change Password
                </button>
              </div>

              {message && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">{message}</div>}
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}
            </div>
          </div>
        </div>
      </main>

      {/* 🔹 Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-xl font-bold text-red-900 text-center mb-4">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className='relative'>
                <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-gray-700"
              />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showCurrentPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              

              {/* New Password */}
              <div className="relative">
                <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  checkPasswordRules(e.target.value);
                }}
                required
                className={`w-full px-3 py-3 border rounded-lg bg-gray-50 focus:ring-2 ${
                  passwordsMatch === null
                    ? 'border-gray-300 focus:ring-gray-700'
                    : passwordsMatch
                    ? 'border-green-500 focus:ring-green-600'
                    : 'border-red-500 focus:ring-red-600'
                }`}
              />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5
                          c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7
                          -4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>


              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    Object.values(passwordRules).filter(Boolean).length === 5 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{
                    width: `${(Object.values(passwordRules).filter(Boolean).length / 5) * 100}%`
                  }}
                ></div>
              </div>

              {/* Rules */}
              <div className="mt-2 text-sm">
                <p className="font-medium">Password must contain:</p>
                <ul className="space-y-1 mt-1">
                  {Object.entries({
                    length: 'At least 8 characters',
                    lowercase: 'At least one lowercase letter',
                    uppercase: 'At least one uppercase letter',
                    number: 'At least one number',
                    symbol: 'At least one special symbol (!@#$%^&*)'
                  }).map(([rule, text]) => (
                    <li key={rule} className={passwordRules[rule] ? 'text-green-600' : 'text-red-600'}>
                      {passwordRules[rule] ? '✔' : '✖'} {text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confirm Password */}
            <div className="relative">
              <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full px-3 py-3 border rounded-lg bg-gray-50 focus:ring-2 ${
                passwordsMatch === null
                  ? 'border-gray-300 focus:ring-gray-700' // neutral
                  : passwordsMatch
                  ? 'border-green-500 focus:ring-green-600' // match
                  : 'border-red-500 focus:ring-red-600' // no match
              }`}
            />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showConfirmPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943
                        -9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0
                        114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3
                        3m6.878 6.878L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732
                        7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                        -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268
                        -2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>


              {passwordMessage && (
                <div
                  className={`text-sm text-center p-3 rounded-lg ${
                    passwordMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {passwordMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetPasswordFields();
                    setShowChangePassword(false);
                  }}
                  className="px-4 py-2 text-sm  font-medium text-white rounded-lg bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
