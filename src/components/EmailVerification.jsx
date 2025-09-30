import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

function EmailVerification() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const { user, logout, updateEmailVerificationStatus } = useAuth()

  useEffect(() => {
    // Check verification status immediately on component mount
    const checkStatus = async () => {
      if (user) {
        try {
          await user.reload()
          if (user.emailVerified) {
            // Update the database to reflect the verification status
            await updateEmailVerificationStatus(true)
            navigate('/dashboard', { replace: true })
          }
        } catch (error) {
          console.error('Error checking initial verification status:', error)
        }
      }
    }
    checkStatus()
  }, [user, navigate, updateEmailVerificationStatus])

  const handleResendVerification = async () => {
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      await sendEmailVerification(user)
      setMessage('Verification email sent successfully!')
    } catch (error) {
      console.error('Resend verification error:', error)
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!user) return

    setLoading(true)
    setMessage('')

    try {
      // Force reload the user to get the latest verification status
      await user.reload()
      
      // Check if email is verified
      if (user.emailVerified) {
        // Update the database to reflect the verification status
        await updateEmailVerificationStatus(true)
        
        setMessage('Email verified successfully! Redirecting...')
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } else {
        setMessage('Email not verified yet. Please check your inbox and click the verification link.')
      }
    } catch (error) {
      console.error('Verification check error:', error)
      setMessage('Error checking verification status. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = async () => {
    try {
      setLoading(true)
      setMessage('Logging out...')
      
      // Use the logout function from AuthContext instead of direct Firebase signOut
      // This ensures proper cleanup of polling intervals and state
      await logout()
      
      // Navigate to home - the AuthContext will handle the state cleanup
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Error during logout:', error)
      setMessage('Error logging out. Redirecting...')
      
      // Fallback: force logout and redirect
      try {
        await signOut(auth)
      } catch (signOutError) {
        console.error('Force signout error:', signOutError)
      }
      
      // Clear storage as fallback
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Please log in first</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-500">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-blue-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification email to{' '}
            <span className="font-medium text-gray-900">{user.email}</span>
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Check your email
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Click the verification link in the email to activate your account.
                  If you don't see the email, check your spam folder.
                </p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`text-sm text-center p-3 rounded-md ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCheckVerification}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Checking verification...' : 'I\'ve verified my email'}
          </button>

          <button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={handleBackToHome}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification
