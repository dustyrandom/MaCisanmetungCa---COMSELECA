import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import CandidacyStatusTracker from './CandidacyStatusTracker'

function Dashboard() {
  const { user, userData, loading } = useAuth()
  const [canSeeSchedule, setCanSeeSchedule] = useState(false)
  const [candidacyStatus, setCandidacyStatus] = useState({ startDate: '', endDate: '' })
  const [hasSubmittedCandidacy, setHasSubmittedCandidacy] = useState(false)

  useEffect(() => {
    const fetchCandidacyStatus = async () => {
      try {
        const csSnap = await get(dbRef(db, 'candidacyStatus'))
        if (csSnap.exists()) {
          setCandidacyStatus(csSnap.val())
        }
      } catch (err) {
        console.error('Failed to fetch candidacy status', err)
      }
    }
    fetchCandidacyStatus()
  }, [])

  const isCandidacyActive = () => {
    if (!candidacyStatus.startDate || !candidacyStatus.endDate) return false
    const now = new Date()
    const start = new Date(candidacyStatus.startDate)
    const end = new Date(candidacyStatus.endDate)
    return now >= start && now <= end
  }

  useEffect(() => {
    const fetchLatestStatus = async () => {
      if (!user) return
      try {
        const appsRef = dbRef(db, `candidacyApplications/${user.uid}`)
        const snapshot = await get(appsRef)
        if (!snapshot.exists()) {
          setCanSeeSchedule(false)
          setHasSubmittedCandidacy(false)
          return
        }
        const appsObj = snapshot.val()
        const apps = Object.keys(appsObj).map(id => ({ id, ...appsObj[id] }))
        const latest = apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        setCanSeeSchedule(latest?.status === 'reviewed')
        setHasSubmittedCandidacy(true)
      } catch {
        setCanSeeSchedule(false)
        setHasSubmittedCandidacy(false)
      }
    }
    fetchLatestStatus()
  }, [user])

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        {userData.role === 'superadmin' && (
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Super Admin Controls</h3>
        )}
        {userData.role === 'admin' && (
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Admin Controls</h3>
        )}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <a href="/admin/manage-news" className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-500 text-center text-sm sm:text-base">Manage News</a>
          <a href="/admin/manage-announcements" className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-500 text-center text-sm sm:text-base">Manage Announcements</a>
          <a href="/admin/manage-candidates" className="bg-purple-700 text-white px-4 py-2 rounded-md hover:bg-purple-600 text-center text-sm sm:text-base">Manage Applications</a>
          <a href="/admin/manage-campaigns" className="bg-pink-700 text-white px-4 py-2 rounded-md hover:bg-pink-600 text-center text-sm sm:text-base">Manage Campaign Materials</a>
          <a href="/admin/manage-elections" className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-center text-sm sm:text-base">Manage Elections</a>
          <a href="/admin/view-results" className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-600 text-center text-sm sm:text-base">Election Results</a>

          {userData.role === 'superadmin' && (
            <>
              <a href="/admin/election-archives" className="bg-teal-800 text-white px-4 py-2 rounded-md hover:bg-teal-700 text-center text-sm sm:text-base">Election Archives</a>
              <a href="/admin/manage-users" className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-center text-sm sm:text-base">Manage Users</a>
              <a href="/admin/activity-log" className="bg-red-800 text-white px-4 py-2 rounded-md hover:bg-red-900 text-center text-sm sm:text-base">Admin Activity Log</a>
            </>
          )}
        </div>
      </div>
    </div>
  )

  const renderVoterDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <CandidacyStatusTracker />
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Available Elections</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 p-4 rounded-lg hover:shadow-sm transition">
            <h4 className="font-semibold text-gray-800">Student Council Elections 2025</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <a href="/vote" className="mt-3 inline-block bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 text-sm font-medium">Vote Now</a>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 text-gray-800">Candidacy Application</h3>
        <p className="text-gray-600 text-sm mb-4">Apply to become a candidate by submitting the required documents.</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/candidacy-application"
            className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${
              !isCandidacyActive() || hasSubmittedCandidacy
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-red-800 text-white hover:bg-red-900'
            }`}
            aria-disabled={!isCandidacyActive() || hasSubmittedCandidacy}
            onClick={(e) => (!isCandidacyActive() || hasSubmittedCandidacy) && e.preventDefault()}
          >
            Submit Candidacy
          </a>
          {canSeeSchedule && (
            <a href="/schedule-appointment" className="inline-block bg-blue-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 text-sm">Go to Screening Appointment</a>
          )}
        </div>
      </div>
    </div>
  )

  const renderCandidateDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <CandidacyStatusTracker />
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Available Elections</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 p-4 rounded-lg hover:shadow-sm transition">
            <h4 className="font-semibold text-gray-800">Student Council Election 2025</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <a href="/vote" className="mt-3 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Vote Now</a>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Your Campaign</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 p-4 rounded-lg hover:shadow-sm transition">
            <h4 className="font-semibold text-gray-800">Student Council Election 2025</h4>
            <div className="mt-4">
              <a href="/campaign" className="inline-block bg-red-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-900 text-sm">Submit Campaign Materials</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAccessDenied = () => (
    <div className="bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )
    }

    if (!userData) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-600">Unable to load user data. Please try refreshing the page.</p>
        </div>
      )
    }


    switch (userData.role) {
      case 'superadmin':
      case 'admin':
        return renderAdminDashboard()
      case 'voter':
        return renderVoterDashboard()
      case 'candidate':
        return renderCandidateDashboard()
      default:
        return renderAccessDenied()
      } 
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-7xl mx-auto pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        {renderDashboardContent()}
      </main>
    </div>
  )
}

export default Dashboard
