
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import './App.css'

import LandingPage from './components/LandingPage'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import EmailVerification from './components/EmailVerification'
import About from './components/About'
import Result from './components/Result'
import Vote from './components/Vote'
import ForgotPassword from './components/ForgotPassword'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/result" element={<Result />} />
            <Route path="/vote" element={<Vote />} />
            
            {/* Public routes - redirect authenticated users */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/verify-email" 
              element={
                <ProtectedRoute requireVerification={false}>
                  <EmailVerification />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
