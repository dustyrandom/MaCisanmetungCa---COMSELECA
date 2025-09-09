import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requireVerification = true }) => {
  const { user, loading, isEmailVerified } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireVerification && !isEmailVerified()) {
    return <Navigate to="/verify-email" replace />
  }

  return children
}

export default ProtectedRoute
