import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import iconHeader from '../assets/icon.png'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
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
      
      // Check verification status and redirect accordingly
      if (isEmailVerified()) {
        navigate('/dashboard')
      } else {
        startVerificationPolling()
        navigate('/verify-email')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address')
      } else if (error.code === 'auth/user-disabled') {
        setError('This account has been disabled')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later')
      } else {
        setError('Login failed. Please try again')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <NavBar />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[600px]">
              {/* Left Panel - Dark Red */}
              <div className="bg-red-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute left-0 top-0 h-full w-auto">
                  <img 
                    src={fingerprintImage} 
                    alt="Fingerprint Pattern" 
                    className="h-full w-auto object-cover"
                  />
                </div>
                
                <div className="relative h-full flex flex-col justify-between p-8">
                  {/* Top Logo */}
                  <div className="flex items-center space-x-3">
                    <img src={iconCard} alt="MaCisanmetungCa Icon" className="h-8 w-8" />
                    <span className="text-white text-lg font-bold">MaCisanmetungCa</span>
                  </div>
                  
                  {/* Center Content */}
                  <div className="text-center text-white">
                    <h2 className="text-lg font-medium mb-2">Student Election Management System</h2>
                    <h1 className="text-3xl font-bold">Mabalacat City College - COMSELECA</h1>
                  </div>
                  
                  {/* Bottom Text */}
                  <div className="text-white text-sm">
                    <p>PEACE. HONESTY. ORDERLY.</p>
                  </div>
                </div>
              </div>

              {/* Right Panel - White Form */}
              <div className="p-8 flex flex-col justify-center">
                {/* College Logos */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <img 
                    src={mccLogo} 
                    alt="Mabalacat City College Logo" 
                    className="w-16 h-16 object-contain"
                  />
                  <img 
                    src={comselecaLogo} 
                    alt="COMSELECA Logo" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-red-800 text-lg font-medium">MABALACAT CITY COLLEGE</h3>
                  <h4 className="text-red-800 text-lg font-bold">COMMISSION ON STUDENT ELECTIONS AND APPOINTMENTS</h4>
                </div>

                {/* Login Form */}
                <div className="max-w-md mx-auto w-full">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Log in</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
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
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
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
                    </div>

                    {/* Remember Me and Forgot Password */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-gray-800 focus:ring-gray-700 border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                          Remember Me
                        </label>
                      </div>
                      <div className="text-sm">
                        <a href="#" className="font-medium text-red-600 hover:text-red-500">
                          Forgot Password?
                        </a>
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      {loading ? 'Logging in...' : 'Log in'}
                    </button>

                    {/* Register Link */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
                          Create an account
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
