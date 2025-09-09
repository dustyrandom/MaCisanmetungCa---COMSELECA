import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PublicRoute = ({ children }) => {
  const { user, loading, isEmailVerified } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If no user, allow access to public routes
  if (!user) {
    return children
  }

  // If logged in and verified, redirect to dashboard
  if (isEmailVerified()) {
    return <Navigate to="/dashboard" replace />
  }

  // If logged in but not verified, redirect to verification page
  return <Navigate to="/verify-email" replace />
}

export default PublicRoute
