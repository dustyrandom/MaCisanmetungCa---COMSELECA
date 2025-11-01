import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { set, ref } from 'firebase/database'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import iconCard from '../assets/icon2.png'
import fingerprintImage from '../assets/fingerprint.png'
import mccLogo from '../assets/mcclogo.png'
import comselecaLogo from '../assets/comselecalogo.png'

function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    institute: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    role: 'voter'
  })

  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { startVerificationPolling } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateEmail = (email) => email.endsWith('@mcc.edu.ph')
  const validateStudentId = (id) => /^\d{4}-\d{4}$/.test(id)
  const validatePassword = (password) => /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)

  const checkPasswordRules = (password) => {
    setPasswordRules({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(formData.email)) return setError('Only Mabalacat City College emails are allowed')
    if (!validateStudentId(formData.studentId)) return setError('Student ID must be in the format 1234-5678')
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match')

    if (!Object.values(passwordRules).every(Boolean)) {
      return setError('Password does not meet all requirements')
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const fullName = `${formData.firstName} ${formData.lastName}`

      await updateProfile(userCredential.user, { displayName: fullName }).catch(() => {})
      await sendEmailVerification(userCredential.user)
      await set(ref(db, `users/${userCredential.user.uid}`), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName,
        email: formData.email,
        institute: formData.institute,
        studentId: formData.studentId,
        role: formData.role,
        emailVerified: false,
        createdAt: new Date().toISOString()
      })

      startVerificationPolling()
      navigate('/verify-email', { replace: true })
    } catch (error) {
      console.error('Registration error:', error)
      const messages = {
        'auth/email-already-in-use': 'Email already registered. Try logging in instead.',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled. Contact support.'
      }
      setError(messages[error.code] || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />

      {/* Main Container */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8 mt-20">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">

            {/* Left Panel */}
            <div className="bg-red-900 relative flex flex-col justify-between p-8 text-white overflow-hidden">
              {/* Background Fingerprint */}
              <div className="absolute inset-0 z-0 opacity-100 mix-blend-overlay">
                <img
                  src={fingerprintImage}
                  alt="Fingerprint Pattern"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center space-x-3">
                  <img src={iconCard} alt="MaCisanmetungCa Icon" className="h-8 w-8" />
                  <span className="text-lg font-bold">MaCisanmetungCa</span>
                </div>

                <div className="text-center px-2 mt-10 lg:mt-0">
                  <h2 className="text-base sm:text-lg font-medium mb-2">
                    Student Council Election Management System
                  </h2>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    Mabalacat City College - COMSELECA
                  </h1>
                </div>

                <div className="text-center text-sm mt-10">
                  <p>PEACE. HONESTY. ORDERLY.</p>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
              {/* Logos */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <img src={mccLogo} alt="MCC Logo" className="w-14 sm:w-16 h-14 sm:h-16 object-contain" />
                <img src={comselecaLogo} alt="COMSELECA Logo" className="w-14 sm:w-16 h-14 sm:h-16 object-contain" />
              </div>

              <div className="text-center mb-8">
                <h3 className="text-red-800 text-base sm:text-lg font-medium">MABALACAT CITY COLLEGE</h3>
                <h4 className="text-red-800 text-base sm:text-lg font-bold">
                  COMMISSION ON STUDENT ELECTIONS AND APPOINTMENTS
                </h4>
              </div>

              {/* Form */}
              <div className="max-w-md w-full mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">Create Account</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>

                  {/* Student ID */}
                  <div>
                    <input
                      type="text"
                      name="studentId"
                      placeholder="Student ID (e.g. 1234-5678)"
                      value={formData.studentId}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9]/g, '')
                        if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8)
                        if (value.length > 9) value = value.slice(0, 9)
                        setFormData({ ...formData, studentId: value })
                      }}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: 1234-5678</p>
                  </div>

                  {/* Institute */}
                  <select
                    name="institute"
                    value={formData.institute}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  >
                    <option value="" disabled>Select Institute</option>
                    <option value="Institute of Arts and Sciences">Institute of Arts and Sciences</option>
                    <option value="Institute of Business and Computing Education">Institute of Business and Computing Education</option>
                    <option value="Institute of Teacher Education">Institute of Teacher Education</option>
                    <option value="Institute of Hospitality and Tourism Management">Institute of Hospitality and Tourism Management</option>
                  </select>

                  {/* Email */}
                  <input
                    type="email"
                    name="email"
                    placeholder="your.email@mcc.edu.ph"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Only @mcc.edu.ph emails are allowed</p>

                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => {
                        handleChange(e)
                        checkPasswordRules(e.target.value)
                      }}
                      className="block w-full pl-3 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* Password strength bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${Object.values(passwordRules).filter(Boolean).length === 5 ? 'bg-green-800' : 'bg-red-800'}`}
                      style={{
                        width: `${(Object.values(passwordRules).filter(Boolean).length / 5) * 100}%`
                      }}
                    ></div>
                  </div>

                  {/* Password rules */}
                  <div className="mt-2 text-sm">
                    <p className="font-medium">Password must contain:</p>
                    <ul className="space-y-1 mt-1">
                      {Object.entries({
                        length: 'At least 8 characters',
                        lowercase: 'At least one lowercase letter',
                        uppercase: 'At least one uppercase letter',
                        number: 'At least one number',
                        symbol: 'At least one special symbol (!@#$%^&*)'
                      }).map(([key, text]) => (
                        <li key={key} className={passwordRules[key] ? 'text-green-800' : 'text-red-800'}>
                          {passwordRules[key] ? '✔' : '✖'} {text}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-3 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showConfirmPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        )}
                      </svg>
                    </button>
                  </div>

                  {/* Error */}
                  {error && <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>}

                  {/* Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-red-800 text-white font-medium hover:bg-red-900 focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>

                  {/* Login link */}
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-red-600 hover:text-red-700 font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
