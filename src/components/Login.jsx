import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import iconCard from '../assets/icon2.png'
import fingerprintImage from '../assets/fingerprint.png'
import mccLogo from '../assets/mcclogo.png'
import comselecaLogo from '../assets/comselecalogo.png'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { isEmailVerified, startVerificationPolling } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await user.reload()

      if (isEmailVerified()) {
        navigate('/dashboard')
      } else {
        startVerificationPolling()
        navigate('/verify-email')
      }
    } catch (error) {
      console.error('Login error:', error)
      switch (error.code) {
        case 'auth/user-not-found':
          setError('No account found with this email')
          break
        case 'auth/wrong-password':
          setError('Incorrect password')
          break
        case 'auth/invalid-email':
          setError('Invalid email address')
          break
        case 'auth/user-disabled':
          setError('This account has been disabled')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later')
          break
        default:
          setError('Login failed. Please try again')
      }
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
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">

            {/* Left Panel */}
            <div className="bg-red-900 relative flex flex-col justify-between p-8 text-white overflow-hidden">
              {/* Background Fingerprint */}
              <div className="absolute inset-0 z-0 opacity-100  mix-blend-overlay">
                <img
                  src={fingerprintImage}
                  alt="Fingerprint Pattern"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <img src={iconCard} alt="MaCisanmetungCa Icon" className="h-8 w-8" />
                  <span className="text-lg font-bold">MaCisanmetungCa</span>
                </div>

                {/* Text Center */}
                <div className="text-center px-2 mt-10 lg:mt-0">
                  <h2 className="text-base sm:text-lg font-medium mb-2">
                    Student Council Election Management System
                  </h2>
                  <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
                    Mabalacat City College - COMSELECA
                  </h1>
                </div>

                {/* Bottom Motto */}
                <div className="text-center text-sm mt-10">
                  <p>PEACE. HONESTY. ORDERLY.</p>
                </div>
              </div>
            </div>

            {/* Right Panel (Form) */}
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

              {/* Login Form */}
              <div className="max-w-md w-full mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">
                  Log in
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
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

                  {/* Remember & Forgot */}
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-red-800 border-gray-300 rounded focus:ring-red-700"
                      />
                      <span className="text-gray-700">Remember Me</span>
                    </label>
                    <Link to="/forgot-password" className="text-red-600 hover:text-red-700 hover:underline">
                      Forgot Password?
                    </Link>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-red-800 text-white font-medium hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 disabled:opacity-50"
                  >
                    {loading ? 'Logging in...' : 'Log in'}
                  </button>

                  {/* Register */}
                  <p className="text-center text-sm text-gray-600">
                    Don’t have an account?{' '}
                    <Link to="/register" className="text-red-600 hover:text-red-700 font-medium hover:underline">
                      Create an account
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

export default Login
