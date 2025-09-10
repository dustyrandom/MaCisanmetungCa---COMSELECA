
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
import CandidacyApplication from './components/CandidacyApplication'
import CandidacyThankYou from './components/CandidacyThankYou'
import ManageCandidates from './components/ManageCandidates'
import ManageUsers from './components/ManageUsers'
import ManageNews from './components/ManageNews'
import ManageAnnouncements from './components/ManageAnnouncements'

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
            <Route 
              path="/candidacy-application" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <CandidacyApplication />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidacy-application/thank-you" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <CandidacyThankYou />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage-candidates" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <ManageCandidates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage-users" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <ManageUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage-news" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <ManageNews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/manage-announcements" 
              element={
                <ProtectedRoute requireVerification={true}>
                  <ManageAnnouncements />
                </ProtectedRoute>
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
